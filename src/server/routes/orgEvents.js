// src/server/routes/orgEvents.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Helper
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

// POST /api/org/events  (create)
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const {
    title, description, category,
    start_at, end_at, location,
    capacity, ticket_type = 'free',
  } = req.body || {};

  // Basic validation
  if (!title || !start_at || !location || !capacity) {
    return sendError(res, 400, 'BAD_REQUEST', 'Missing required fields');
  }
  if (!Number.isFinite(Number(capacity)) || Number(capacity) <= 0) {
    return sendError(res, 400, 'BAD_REQUEST', 'Capacity must be a positive integer');
  }

  try {
    // Find organizer row for this user
    const orgRes = await pool.query(`SELECT id FROM organizers WHERE user_id = $1`, [userId]);
    if (orgRes.rowCount === 0) return sendError(res, 403, 'FORBIDDEN', 'Organizer role required');

    const org_id = orgRes.rows[0].id;

    const { rows } = await pool.query(
      `
      INSERT INTO events
        (org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status, created_at, updated_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,'submitted', NOW(), NOW())
      RETURNING id, org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status
      `,
      [org_id, title, description || null, category || null, start_at, end_at || null, location, Number(capacity), ticket_type]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('DB insert error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'DB error', err.message);
  }
});

// PUT /api/org/events/:id (update before start)
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid event id');
  }

  const {
    title, description, category,
    start_at, end_at, location,
    capacity, ticket_type
  } = req.body || {};

  try {
    // Ownership + editability check
    const { rows: own } = await pool.query(
      `SELECT e.id, e.start_at
         FROM events e
         JOIN organizers o ON o.id = e.org_id
        WHERE e.id = $1 AND o.user_id = $2`,
      [eventId, userId]
    );
    if (!own.length) return sendError(res, 403, 'FORBIDDEN', 'Not your event');
    if (own[0].start_at && new Date(own[0].start_at) <= new Date()) {
      return sendError(res, 400, 'EVENT_STARTED', 'Cannot edit after event start');
    }

    const { rows } = await pool.query(
      `
      UPDATE events
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             category = COALESCE($4, category),
             start_at = COALESCE($5, start_at),
             end_at = COALESCE($6, end_at),
             location = COALESCE($7, location),
             capacity = COALESCE($8, capacity),
             ticket_type = COALESCE($9, ticket_type),
             updated_at = NOW()
       WHERE id = $1
       RETURNING id, org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status
      `,
      [
        eventId,
        title ?? null, description ?? null, category ?? null,
        start_at ?? null, end_at ?? null, location ?? null,
        capacity ?? null, ticket_type ?? null
      ]
    );

    if (!rows.length) return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    return res.json(rows[0]);
  } catch (err) {
    console.error('DB update error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'DB error', err.message);
  }
});

// GET /api/org/events/:id/attendees.csv  (CSV export)
router.get('/:id/attendees.csv', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid event id');
  }

  try {
    // Ownership check
    const { rows: own } = await pool.query(
      `SELECT e.id
         FROM events e
         JOIN organizers o ON o.id = e.org_id
        WHERE e.id = $1 AND o.user_id = $2`,
      [eventId, userId]
    );
    if (!own.length) return sendError(res, 403, 'FORBIDDEN', 'Not your event');

   // Join users + tickets for CSV (no student_id)
const { rows } = await pool.query(
  `
  SELECT
    u.name           AS attendee_name,
    u.email          AS email,
    t.id             AS ticket_id,
    t.status         AS ticket_status,
    t.issued_at      AS issued_at,
    t.checked_in_at  AS checked_in_at
  FROM tickets t
  JOIN users u   ON u.id = t.user_id
  WHERE t.event_id = $1
  ORDER BY t.issued_at NULLS LAST, t.id
  `,
  [eventId]
);

// Build CSV (remove student_id from header)
const keys = [
  "attendee_name",
  "email",
  "ticket_id",
  "ticket_status",
  "issued_at",
  "checked_in_at",
];

    const header = keys.join(",");
    const lines = rows.map(r => keys.map(k => {
      let v = r[k] == null ? "" : String(r[k]);
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    }).join(","));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="attendees-${eventId}.csv"`);
    return res.send([header, ...lines].join("\n"));
  } catch (err) {
    console.error('DB attendees error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Server error', err.message);
  }
});

module.exports = router;
