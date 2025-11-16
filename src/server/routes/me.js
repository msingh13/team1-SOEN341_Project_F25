// src/server/routes/me.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { ensureRole } = require('../middleware/roles');

// GET /me/events  → events owned by the current organizer/admin
router.get('/events', authenticateToken, ensureRole('organizer', 'admin'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Find organizer row for this user
    const org = await pool.query(`SELECT id FROM organizers WHERE user_id = $1`, [userId]);
    if (org.rowCount === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ code: "FORBIDDEN", message: "Organizer role required" });
    }

    // If admin without organizer record, show everything, else filter by org_id
    const isAdminNoOrg = req.user.role === 'admin' && org.rowCount === 0;

    const q = isAdminNoOrg
      ? `
        SELECT id, org_id, title, description, category,
               start_at, end_at, location, capacity, ticket_type, status
          FROM events
         ORDER BY COALESCE(start_at, now()) ASC, id ASC
        `
      : `
        SELECT e.id, e.org_id, e.title, e.description, e.category,
               e.start_at, e.end_at, e.location, e.capacity, e.ticket_type, e.status
          FROM events e
          JOIN organizers o ON o.id = e.org_id
         WHERE o.user_id = $1
         ORDER BY COALESCE(e.start_at, now()) ASC, e.id ASC
        `;

    const params = isAdminNoOrg ? [] : [userId];
    const { rows } = await pool.query(q, params);

    // Return keys friendly to the frontend (both snake and camel are okay)
    const data = rows.map(r => ({
      id: r.id,
      title: r.title,
      location: r.location,
      start_time: r.start_at,
      end_time: r.end_at,
      capacity: r.capacity,
      ticket_type: r.ticket_type,
      status: r.status,
    }));

    res.json({ data });
  } catch (err) {
    console.error('GET /me/events error', err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

module.exports = router;
