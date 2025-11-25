// src/server/routes/orgEvents.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ Defensive middleware import (supports default or named export)
const authModule = require('../middleware/auth');
const authenticateToken = authModule?.authenticateToken || authModule;

// ---------- helper ----------
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/* =========================================================
 *  LIST (Organizer scope)
 *  GET /api/org/events?mine=1
 *  - mine=1 => only events that belong to the current organizer (by user_id)
 *  - returns issued_count and remaining computed from tickets
 * ======================================================= */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const mine = String(req.query.mine || '') === '1';

  try {
    let where = '';
    let params = [];
    if (mine) {
      // limit to events owned by the organizer (user_id)
      where = `WHERE o.user_id = $1`;
      params = [userId];
    }

    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.location,
        e.start_at,
        e.capacity,
        e.status,
        COALESCE(
          COUNT(t.id) FILTER (WHERE t.status IN ('claimed','checked_in')), 0
        )::int AS issued_count,
        GREATEST(
          e.capacity - COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('claimed','checked_in')), 0),
          0
        )::int AS remaining
      FROM events e
      JOIN organizers o ON o.id = e.org_id
      LEFT JOIN tickets t ON t.event_id = e.id
      ${where}
      GROUP BY e.id, e.title, e.location, e.start_at, e.capacity, e.status
      ORDER BY e.start_at NULLS LAST, e.id
      `,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error('orgEvents list error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'DB error', err.message);
  }
});

/* =========================================================
 *  SINGLE (Organizer scope)
 *  GET /api/org/events/:id
 *  - returns issued_count and remaining too
 * ======================================================= */
router.get('/:id', authenticateToken, async (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid event id');
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        e.org_id,
        e.title,
        e.description,
        e.category,
        e.start_at,
        e.end_at,
        e.location,
        e.capacity,
        e.ticket_type,
        e.status,
        e.waitlist_enabled,
        e.waitlist_offer_window,
        e.waitlist_queue_cap,
        COALESCE(
          COUNT(t.id) FILTER (WHERE t.status IN ('claimed','checked_in')), 0
        )::int AS issued_count,
        GREATEST(
          e.capacity - COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('claimed','checked_in')), 0),
          0
        )::int AS remaining
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
      `,
      [eventId]
    );

    if (!rows.length) return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    return res.json(rows[0]);
  } catch (err) {
    console.error('orgEvents get error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'DB error', err.message);
  }
});

/* =========================================================
 *  CREATE
 *  POST /api/org/events
 *  Body: { title, description?, category?, start_at, end_at?, location, capacity, ticket_type? }
 * ======================================================= */
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const {
    title,
    description,
    category,
    start_at,
    end_at,
    location,
    capacity,
    ticket_type = "free",

    // ✅ waitlist settings on create
    waitlist_enabled,
    waitlist_offer_window,
    waitlist_queue_cap,
  } = req.body || {};

  if (!title || !start_at || !location || capacity == null) {
    return sendError(res, 400, 'BAD_REQUEST', 'Missing required fields');
  }

  const capacityNum = Number(capacity);
  if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
    return sendError(res, 400, 'BAD_REQUEST', 'Capacity must be a positive integer');
  }

  // ✅ basic validation for waitlist settings
  if (waitlist_enabled) {
    if (
      !Number.isFinite(Number(waitlist_offer_window)) ||
      Number(waitlist_offer_window) <= 0
    ) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Offer window (minutes) must be a positive number"
      );
    }
    if (
      !Number.isFinite(Number(waitlist_queue_cap)) ||
      Number(waitlist_queue_cap) <= 0
    ) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Queue cap must be a positive number"
      );
    }
  }

  try {
    // Find organizer row for this user
    const orgRes = await pool.query(`SELECT id FROM organizers WHERE user_id = $1`, [userId]);
    if (orgRes.rowCount === 0) return sendError(res, 403, 'FORBIDDEN', 'Organizer role required');

    const org_id = orgRes.rows[0].id;

    // ✅ normalize waitlist values on create
    const wlEnabled = !!waitlist_enabled;
    const wlWindow = wlEnabled ? Number(waitlist_offer_window || 0) : null;
    const wlCap = wlEnabled ? Number(waitlist_queue_cap || 0) : null;

    const { rows } = await pool.query(
      `
      INSERT INTO events
        (org_id, title, description, category, start_at, end_at, location, capacity, ticket_type,
         status, created_at, updated_at,
         waitlist_enabled, waitlist_offer_window, waitlist_queue_cap)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,
         'submitted', NOW(), NOW(),
         $10,$11,$12)
      RETURNING id, org_id, title, description, category, start_at, end_at,
                location, capacity, ticket_type, status,
                waitlist_enabled, waitlist_offer_window, waitlist_queue_cap
      `,
      [
        org_id,
        title,
        description || null,
        category || null,
        start_at,
        end_at || null,
        location,
        capacityNum,
        ticket_type,
        wlEnabled,
        wlWindow,
        wlCap,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('DB insert error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'DB error', err.message);
  }
});

/* =========================================================
 *  UPDATE (before event start)
 *  PUT /api/org/events/:id
 * ======================================================= */
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
  }

  const {
    title,
    description,
    category,
    start_at,
    end_at,
    location,
    capacity,
    ticket_type,

    // ✅ new waitlist settings from body
    waitlist_enabled,
    waitlist_offer_window,
    waitlist_queue_cap,
  } = req.body || {};

  // ---- basic validation for waitlist settings ----
  if (waitlist_enabled) {
    if (
      !Number.isFinite(Number(waitlist_offer_window)) ||
      Number(waitlist_offer_window) <= 0
    ) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Offer window (minutes) must be a positive number"
      );
    }
    if (
      !Number.isFinite(Number(waitlist_queue_cap)) ||
      Number(waitlist_queue_cap) <= 0
    ) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Queue cap must be a positive number"
      );
    }
  }

  const hasCapacityChange = capacity !== undefined && capacity !== null;
  let capacityNum = null;

  if (hasCapacityChange) {
    capacityNum = Number(capacity);
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Capacity must be a positive integer"
      );
    }
  }

  try {
    // Ownership + time check
    const { rows: own } = await pool.query(
      `SELECT e.id, e.start_at
         FROM events e
         JOIN organizers o ON o.id = e.org_id
        WHERE e.id = $1 AND o.user_id = $2`,
      [eventId, userId]
    );
    if (!own.length) {
      return sendError(res, 403, "FORBIDDEN", "Not your event");
    }
    if (own[0].start_at && new Date(own[0].start_at) <= new Date()) {
      return sendError(res, 400, "EVENT_STARTED", "Cannot edit after event start");
    }

    // If capacity is being changed, ensure it's not below already issued tickets
    if (hasCapacityChange) {
      const { rows: usedRows } = await pool.query(
        `
        SELECT COALESCE(COUNT(*),0)::int AS used
        FROM tickets
        WHERE event_id = $1
          AND status IN ('claimed','checked_in')
        `,
        [eventId]
      );
      const used = usedRows[0]?.used ?? 0;
      if (capacityNum < used) {
        return sendError(
          res,
          409,
          "CAPACITY_TOO_LOW",
          `Capacity cannot be lower than already issued tickets (${used}).`
        );
      }
    }

    const { rows } = await pool.query(
      `
      UPDATE events
         SET title                  = COALESCE($2,  title),
             description            = COALESCE($3,  description),
             category               = COALESCE($4,  category),
             start_at               = COALESCE($5,  start_at),
             end_at                 = COALESCE($6,  end_at),
             location               = COALESCE($7,  location),
             capacity               = COALESCE($8,  capacity),
             ticket_type            = COALESCE($9,  ticket_type),
             waitlist_enabled       = COALESCE($10, waitlist_enabled),
             waitlist_offer_window  = $11,
             waitlist_queue_cap     = $12,
             updated_at             = NOW()
       WHERE id = $1
       RETURNING id, org_id, title, description, category, start_at, end_at,
                 location, capacity, ticket_type, status,
                 waitlist_enabled, waitlist_offer_window, waitlist_queue_cap
      `,
      [
        eventId,
        title ?? null,
        description ?? null,
        category ?? null,
        start_at ?? null,
        end_at ?? null,
        location ?? null,
        hasCapacityChange ? capacityNum : null,
        ticket_type ?? null,
        typeof waitlist_enabled === "boolean" ? waitlist_enabled : null,
        waitlist_enabled ? Number(waitlist_offer_window ?? 0) : null,
        waitlist_enabled ? Number(waitlist_queue_cap ?? 0) : null,
      ]
    );

    if (!rows.length) {
      return sendError(res, 404, "NOT_FOUND", "Event not found");
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("DB update error", err);
    return sendError(res, 500, "INTERNAL_ERROR", "DB error", err.message);
  }
});

/* =========================================================
 *  CSV EXPORT
 *  GET /api/org/events/:id/attendees.csv
 * ======================================================= */
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

    // Build CSV rows
    const { rows } = await pool.query(
      `
      SELECT
        u.name           AS attendee_name,
        u.student_id     AS student_id,
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

    const keys = ["attendee_name","student_id","email","ticket_id","ticket_status","issued_at","checked_in_at"];
    const header = keys.join(",");
    const lines = rows.map(r => keys.map(k => {
      let v = r[k] == null ? "" : String(r[k]);
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        v = '"' + v.replace(/"/g,'""') + '"';
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

/* =========================================================
 *  ANALYTICS  (matches client path /api/org/events/:id/analytics)
 *  GET /:id/analytics
 * ======================================================= */
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, 'BAD_REQUEST', 'Invalid event id');
  }

  try {
    // Verify the requester owns this event via organizers table
    const own = await pool.query(
      `
      SELECT e.id
        FROM events e
        JOIN organizers o ON o.id = e.org_id OR o.org_id = e.org_id
       WHERE e.id = $1 AND o.user_id = $2
       LIMIT 1
      `,
      [eventId, userId]
    );
    if (own.rowCount === 0) {
      return sendError(res, 403, 'FORBIDDEN', 'Not your event');
    }

    // Aggregate ticket stats
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        COALESCE(e.capacity, 0)                                                AS capacity,
        COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END), 0)::int    AS tickets_issued,
        COALESCE(SUM(CASE WHEN t.status = 'checked_in' THEN 1 ELSE 0 END), 0)::int AS tickets_checked_in
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id, e.capacity
      `,
      [eventId]
    );

    if (!rows.length) {
      return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    }

    const r = rows[0];
    const remaining_capacity = Math.max(r.capacity - r.tickets_issued, 0);
    const attendance_rate =
      r.tickets_issued === 0 ? 0 : Math.round((r.tickets_checked_in / r.tickets_issued) * 100);

    return res.json({
      tickets_issued: r.tickets_issued,
      tickets_checked_in: r.tickets_checked_in,
      remaining_capacity,
      attendance_rate,
    });
  } catch (err) {
    console.error('orgEvents analytics error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to load analytics', err.message);
  }
});

module.exports = router;
