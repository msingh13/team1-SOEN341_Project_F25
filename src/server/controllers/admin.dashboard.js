// src/server/controllers/admin.dashboard.js
const db = require("../db");

/**
 * GET /admin/events/submitted
 * List all events waiting for moderation.
 */
exports.listSubmitted = async (req, res) => {
  try {
    const sql = `
      SELECT 
        e.id,
        e.title,
        e.category,
        e.location,
        e.start_at,
        e.status,
        o.name AS organizer
      FROM events e
      LEFT JOIN organizations o ON o.id = e.org_id
      WHERE e.status = 'submitted'
      ORDER BY e.start_at ASC NULLS LAST, e.created_at DESC
    `;

    const { rows } = await db.query(sql);

    return res.json(rows);
  } catch (err) {
    console.error("❌ admin.listSubmitted error:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to load submitted events",
    });
  }
};

/**
 * GET /admin/stats
 * Very lightweight global stats for dashboard top bar.
 */
exports.globalStats = async (req, res) => {
  try {
    const [ev, tk, ci] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS c FROM events`),
      db.query(`SELECT COUNT(*)::int AS c FROM tickets`),
      db.query(`SELECT COUNT(*)::int AS c FROM tickets WHERE status = 'checked_in'`),
    ]);

    return res.json({
      events: ev.rows[0].c,
      tickets: tk.rows[0].c,
      checkedIn: ci.rows[0].c,
    });
  } catch (err) {
    console.error("❌ admin.globalStats error:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to load global stats",
    });
  }
};
