// server/routes/organizer.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * GET /org/events
 * List events for the current organizer/admin.
 * Uses user_org_roles → NOT old organizers table.
 */
router.get("/org/events", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    // Find the org(s) this user belongs to
    const orgRows = await pool.query(
      `
      SELECT org_id
      FROM user_org_roles
      WHERE user_id = $1 AND role IN ('organizer','admin')
      `,
      [userId]
    );

    if (orgRows.rowCount === 0) {
      return sendError(res, 403, "FORBIDDEN", "Organizer role required");
    }

    const orgIds = orgRows.rows.map((r) => r.org_id);

    const { rows: events } = await pool.query(
      `
      SELECT
        e.id, e.title, e.start_at, e.location, e.capacity, e.status,
        GREATEST(
          0,
          e.capacity - COALESCE((
            SELECT COUNT(*)::int
              FROM tickets t
             WHERE t.event_id = e.id
               AND t.status IN ('claimed','checked_in')
          ), 0)
        ) AS remaining
      FROM events e
      WHERE e.org_id = ANY($1::int[])
      ORDER BY e.start_at ASC NULLS LAST, e.id ASC
      LIMIT $2 OFFSET $3
      `,
      [orgIds, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM events WHERE org_id = ANY($1::int[])`,
      [orgIds]
    );

    return res.json({
      page,
      limit,
      total: count.rows[0].total,
      totalPages: Math.max(1, Math.ceil(count.rows[0].total / limit)),
      data: events,
    });
  } catch (err) {
    console.error("❌ Error fetching organizer events:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Unexpected error", err.message);
  }
});

/**
 * GET /org/events/:id/analytics
 * Organizer analytics for one event.
 */
router.get("/org/events/:id/analytics", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);

  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, "BAD_REQUEST", "Invalid event ID");
  }

  try {
    // Ownership check using user_org_roles
    const own = await pool.query(
      `
      SELECT e.id
      FROM events e
      JOIN user_org_roles r ON r.org_id = e.org_id
      WHERE e.id = $1
        AND r.user_id = $2
        AND r.role IN ('organizer','admin')
      LIMIT 1
      `,
      [eventId, userId]
    );

    if (own.rowCount === 0) {
      return sendError(res, 403, "FORBIDDEN", "You do not own this event");
    }

    const { rows } = await pool.query(
      `
      SELECT
        e.capacity,
        COUNT(t.*)::int AS tickets_issued,
        COUNT(*) FILTER (WHERE t.status = 'checked_in')::int AS tickets_checked_in
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.capacity
      `,
      [eventId]
    );

    if (!rows.length) {
      return sendError(res, 404, "NOT_FOUND", "Event not found");
    }

    const r = rows[0];
    const remaining = Math.max(r.capacity - r.tickets_issued, 0);
    const attendance =
      r.tickets_issued === 0
        ? 0
        : Math.round((r.tickets_checked_in / r.tickets_issued) * 100);

    return res.json({
      tickets_issued: r.tickets_issued,
      tickets_checked_in: r.tickets_checked_in,
      remaining_capacity: remaining,
      attendance_rate: attendance,
    });
  } catch (err) {
    console.error("❌ Error fetching event analytics:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to load analytics data");
  }
});

module.exports = router;
