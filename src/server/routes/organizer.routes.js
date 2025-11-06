// src/server/routes/organizer.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

// GET /org/events (owned by organizer)
router.get("/org/events", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const orgResult = await pool.query(
      "SELECT org_id FROM organizers WHERE user_id = $1",
      [userId]
    );
    
    if (orgResult.rowCount === 0) {
      return sendError(res, 403, "FORBIDDEN", "Organizer role required");
    }
    
    const orgId = orgResult.rows[0].org_id;
    

    const { rows: data } = await pool.query(
      `
      SELECT
        e.id, e.title, e.start_at, e.location, e.capacity, e.status,
        GREATEST(0, e.capacity - COALESCE((
          SELECT COUNT(*) FROM tickets t
          WHERE t.event_id = e.id AND t.status IN ('claimed','checked_in')
        ), 0)) AS remaining
      FROM events e
      WHERE e.org_id = $1
      ORDER BY e.start_at ASC
      LIMIT $2 OFFSET $3
      `,
      [orgId, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int AS total FROM events WHERE org_id = $1",
      [orgId]
    );

    return res.json({
      page, limit,
      total: countRows[0].total,
      totalPages: Math.max(1, Math.ceil(countRows[0].total / limit)),
      data,
    });
  } catch (err) {
    console.error("❌ Error fetching organizer events:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Unexpected error", err.message);
  }
});

// GET /org/events/:id/analytics (single clean implementation)
router.get("/org/events/:id/analytics", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event ID" });
  }

  try {
    // Ownership check
    const orgCheck = await pool.query(
      `SELECT o.id
         FROM organizers o
         JOIN events e ON e.org_id = o.id
        WHERE e.id = $1 AND o.user_id = $2`,
      [eventId, userId]
    );
    if (orgCheck.rowCount === 0) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Not your event" });
    }

    // Use DISTINCT to avoid over-count from multiple joins
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        e.capacity,
        COUNT(DISTINCT t_all.id)::int       AS tickets_issued,
        COUNT(DISTINCT t_checked.id)::int   AS tickets_checked_in,
        GREATEST(0, e.capacity - COUNT(DISTINCT t_all.id))::int AS remaining_capacity
      FROM events e
      LEFT JOIN tickets t_all
        ON t_all.event_id = e.id
      LEFT JOIN tickets t_checked
        ON t_checked.event_id = e.id AND t_checked.status = 'checked_in'
      WHERE e.id = $1
      GROUP BY e.id, e.capacity
      `,
      [eventId]
    );

    if (!rows.length) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
    }

    const r = rows[0];
    const attendance_rate =
      r.tickets_issued === 0 ? 0 : Math.round((r.tickets_checked_in / r.tickets_issued) * 100);

    return res.json({
      tickets_issued: r.tickets_issued,
      tickets_checked_in: r.tickets_checked_in,
      remaining_capacity: r.remaining_capacity,
      attendance_rate,
    });
  } catch (err) {
    console.error("❌ Error fetching event analytics:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to load analytics data",
      details: err.message,
    });
  }
});

module.exports = router;
