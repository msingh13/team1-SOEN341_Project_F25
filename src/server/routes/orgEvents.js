// src/server/routes/orgEvents.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { ensureRole } = require('../middleware/roles');

function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/** --------------------------
 * GET /api/org/events
 *  - If ?mine=1: return events owned by the current organizer
 *  - Else: return all (admin only)
 * -------------------------- */
router.get('/', authenticateToken, ensureRole('organizer', 'admin'), async (req, res) => {
  try {
    const mine = String(req.query.mine || '') === '1';
    const userId = req.user.id;

    if (mine && req.user.role === 'organizer') {
      const { rows } = await pool.query(
        `SELECT e.id, e.org_id, e.title, e.description, e.category,
                e.start_at, e.end_at, e.location, e.capacity, e.ticket_type, e.status
           FROM events e
           JOIN organizers o ON o.id = e.org_id
          WHERE o.user_id = $1
          ORDER BY COALESCE(e.start_at, now()) ASC, e.id ASC`,
        [userId]
      );
      return res.json({ data: rows });
    }

    // Admin path (mine not requested)
    if (req.user.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Admin only');
    }

    const { rows } = await pool.query(
      `SELECT id, org_id, title, description, category,
              start_at, end_at, location, capacity, ticket_type, status
         FROM events
        ORDER BY COALESCE(start_at, now()) ASC, id ASC`
    );
    return res.json({ data: rows });
  } catch (err) {
    console.error('GET /api/org/events error', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Server error');
  }
});

/* keep your existing POST / (create), PUT /:id (update), GET /:id/attendees.csv as you already have */
module.exports = router;
