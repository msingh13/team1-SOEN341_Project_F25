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

module.exports = router;
