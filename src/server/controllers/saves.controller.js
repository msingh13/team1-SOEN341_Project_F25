// src/server/controllers/saves.controller.js
// Assumes you have a db client that exposes db.query(sql, params)
// If your db module is different, tell me and I’ll adapt it.

const db = require('../db'); // usually src/server/db/index.js
// If your db export is { pool }, you can do: const { pool } = require('../db'); and replace db.query with pool.query

// Helper for consistent errors
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

// POST /events/:id/save
async function saveEvent(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Login required');
    }
    const userId = req.user.id;
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid event id');
    }

    // ensure event exists
    const ev = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (ev.rowCount === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    }

    // idempotent insert
    await db.query(
      `INSERT INTO saves (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, eventId]
    );

    return res.status(200).json({ code: 'SAVED', message: 'Event saved.' });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}

// DELETE /events/:id/save
async function unsaveEvent(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Login required');
    }
    const userId = req.user.id;
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid event id');
    }

    // (optional) keep consistent 404s if event truly doesn't exist
    const ev = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (ev.rowCount === 0) {
      return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    }

    const result = await db.query(
      `DELETE FROM saves WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    if (result.rowCount === 0) {
      return res.status(200).json({ code: 'NOT_SAVED', message: 'No change.' });
    }
    return res.status(200).json({ code: 'UNSAVED', message: 'Event removed from saves.' });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}

// GET /me/saves
async function listMySaves(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Login required');
    }
    const userId = req.user.id;

    const { rows } = await db.query(
        `SELECT e.id, e.title, e.description,
                e.start_at AS "startTime",
                e.end_at   AS "endTime",
                e.location
        FROM saves s
        JOIN events e ON e.id = s.event_id
        WHERE s.user_id = $1
        ORDER BY e.start_at ASC`,
      [userId]
    );

    return res.status(200).json({ items: rows });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}

module.exports = { saveEvent, unsaveEvent, listMySaves };
