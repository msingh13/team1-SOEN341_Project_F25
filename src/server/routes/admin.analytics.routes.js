// src/server/routes/admin.analytics.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

/**
 * GET /admin/stats
 * returns:
 * {
 *   total_events,
 *   total_tickets,
 *   total_users,
 *   issued_today,
 *   by_day: [{ day, issued }],
 *   participation_rate
 * }
 *
 * Used by AdminHome.tsx / AdminStats.tsx
 */
router.get(
  "/admin/stats",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      const [
        { rows: a },
        { rows: b },
        { rows: c },
        { rows: d },
      ] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS total_events FROM events`),
        pool.query(`SELECT COUNT(*)::int AS total_tickets FROM tickets`),
        pool.query(`SELECT COUNT(*)::int AS total_users FROM users`),
        pool.query(`
          SELECT to_char(date_trunc('day', issued_at), 'YYYY-MM-DD') AS day,
                 COUNT(*)::int AS issued
          FROM tickets
          WHERE issued_at IS NOT NULL
          GROUP BY 1
          ORDER BY 1
        `),
      ]);

      const issuedTodayRes = await pool.query(
        `SELECT COUNT(*)::int AS issued_today
         FROM tickets
         WHERE issued_at::date = CURRENT_DATE`
      );
      const issuedToday = issuedTodayRes.rows[0]?.issued_today ?? 0;

      // participation rate = avg( checked_in / issued ) across events
      const pr = await pool.query(`
        SELECT AVG(
                 CASE
                   WHEN issued_cnt > 0
                     THEN checked_cnt::numeric / issued_cnt
                   ELSE 0
                 END
               ) AS rate
        FROM (
          SELECT event_id,
                 COUNT(*) FILTER (WHERE issued_at IS NOT NULL)   AS issued_cnt,
                 COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) AS checked_cnt
          FROM tickets
          GROUP BY event_id
        ) s
      `);

      const participation_rate = Math.round(
        Number(pr.rows[0]?.rate || 0) * 100
      );

      res.json({
        total_events: a[0].total_events,
        total_tickets: b[0].total_tickets,
        total_users: c[0].total_users,
        issued_today: issuedToday,
        by_day: d,
        participation_rate,
      });
    } catch (e) {
      console.error("stats error", e);
      res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

module.exports = router;
