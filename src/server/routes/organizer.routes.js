const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

// Helper for consistent JSON error format
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

// -------------------------------------------------------------
// GET /org/events
// Purpose: return all events created by the authenticated organizer
// -------------------------------------------------------------
router.get("/org/events", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    // -------------------------------------------------------------
    // 1. Verify that this user is an organizer
    // -------------------------------------------------------------
    const orgResult = await pool.query(
      "SELECT id FROM organizers WHERE user_id = $1",
      [userId]
    );

    if (orgResult.rowCount === 0) {
      return sendError(res, 403, "FORBIDDEN", "Organizer role required");
    }

    const orgId = orgResult.rows[0].id;

    // -------------------------------------------------------------
    // 2. Fetch events owned by this organizer
    // -------------------------------------------------------------
    const { rows: data } = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.start_at,
        e.location,
        e.capacity,
        e.status,
        GREATEST(0, e.capacity - COALESCE((
          SELECT COUNT(*) FROM tickets t
          WHERE t.event_id = e.id AND t.status = 'claimed'
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

    // -------------------------------------------------------------
    // 3. Send formatted response
    // -------------------------------------------------------------
    return res.json({
      page,
      limit,
      total: countRows[0].total,
      totalPages: Math.max(1, Math.ceil(countRows[0].total / limit)),
      data,
    });
  } catch (err) {
    console.error("❌ Error fetching organizer events:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Unexpected error", err.message);
  }
});

// --- Event Analytics for Organizer ---
router.get("/org/events/:id/analytics", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const eventId = Number(req.params.id);
  
    if (!Number.isFinite(eventId))
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event ID" });
  
    try {
      // Verify organizer ownership
      const orgCheck = await pool.query(
        `SELECT o.id
           FROM organizers o
           JOIN events e ON e.org_id = o.id
          WHERE e.id = $1 AND o.user_id = $2`,
        [eventId, userId]
      );
  
      if (orgCheck.rowCount === 0)
        return res.status(403).json({ code: "FORBIDDEN", message: "Not your event" });
  
      // Fetch analytics data
      const { rows } = await pool.query(
        `
        SELECT
          e.id,
          e.title,
          e.capacity,
          COUNT(t.id)::int AS total_tickets,
          COUNT(t_checked.id)::int AS checked_in,
          GREATEST(0, e.capacity - COUNT(t.id))::int AS remaining
        FROM events e
        LEFT JOIN tickets t ON t.event_id = e.id
        LEFT JOIN tickets t_checked ON t_checked.event_id = e.id AND t_checked.status = 'checked_in'
        WHERE e.id = $1
        GROUP BY e.id, e.title, e.capacity
        `,
        [eventId]
      );
  
      if (!rows.length)
        return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
  
      const r = rows[0];
      const attendanceRate =
        r.total_tickets === 0 ? 0 : Math.round((r.checked_in / r.total_tickets) * 100);
  
      res.json({
        id: r.id,
        title: r.title,
        capacity: r.capacity,
        totalTickets: r.total_tickets,
        checkedIn: r.checked_in,
        remaining: r.remaining,
        attendanceRate,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Failed to load analytics", details: err.message });
    }
  });

  // -------------------------------------------------------------
// GET /org/events/:id/analytics
// Purpose: Return analytics metrics for a specific event
// -------------------------------------------------------------
router.get("/org/events/:id/analytics", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const eventId = Number(req.params.id);
  
    if (!Number.isFinite(eventId))
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event ID" });
  
    try {
      // -------------------------------------------------------------
      // 1. Verify organizer ownership of this event
      // -------------------------------------------------------------
      const orgCheck = await pool.query(
        `
        SELECT o.id
        FROM organizers o
        JOIN events e ON e.org_id = o.id
        WHERE e.id = $1 AND o.user_id = $2
        `,
        [eventId, userId]
      );
  
      if (orgCheck.rowCount === 0) {
        return res
          .status(403)
          .json({ code: "FORBIDDEN", message: "You are not authorized to view this event’s analytics" });
      }
  
      // -------------------------------------------------------------
      // 2. Query aggregated analytics metrics
      // -------------------------------------------------------------
      const { rows } = await pool.query(
        `
        SELECT
          e.id,
          e.capacity,
          COUNT(t.id)::int AS tickets_issued,
          COUNT(t_checked.id)::int AS tickets_checked_in,
          GREATEST(0, e.capacity - COUNT(t.id))::int AS remaining_capacity
        FROM events e
        LEFT JOIN tickets t ON t.event_id = e.id
        LEFT JOIN tickets t_checked ON t_checked.event_id = e.id AND t_checked.status = 'checked_in'
        WHERE e.id = $1
        GROUP BY e.id, e.capacity
        `,
        [eventId]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
      }
  
      const r = rows[0];
      const attendanceRate =
        r.tickets_issued === 0 ? 0 : Math.round((r.tickets_checked_in / r.tickets_issued) * 100);
  
      // -------------------------------------------------------------
      // 3. Return consistent response format
      // -------------------------------------------------------------
      return res.json({
        tickets_issued: r.tickets_issued,
        tickets_checked_in: r.tickets_checked_in,
        remaining_capacity: r.remaining_capacity,
        attendance_rate: attendanceRate,
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
