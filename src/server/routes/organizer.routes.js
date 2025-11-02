const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

// GET /me/events
router.get("/me/events", authenticateToken, async (req, res) => {
  const userId = req.user?.id || req.headers["x-user-id"];
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const perPage = Math.min(20, parseInt(req.query.perPage || "20", 10));
  const offset = (page - 1) * perPage;
  const sort = req.query.sort === "start_desc" ? "DESC" : "ASC";

  try {
    // Check if user is an organizer
    const orgCheck = await pool.query(
      `SELECT id FROM organizers WHERE user_id=$1`,
      [userId]
    );
    if (orgCheck.rowCount === 0)
      return res.status(403).json({ code: "FORBIDDEN", message: "Organizer access only" });

    const organizerId = orgCheck.rows[0].id;

    // Query organizer’s events
    const { rows: events } = await pool.query(
      `
      SELECT 
        id, title, start_at, location, capacity, 
        (SELECT COUNT(*) FROM tickets WHERE event_id=e.id AND status='claimed') AS claimed,
        status
      FROM events e
      WHERE e.org_id=$1
      ORDER BY e.start_at ${sort}
      LIMIT $2 OFFSET $3
      `,
      [organizerId, perPage, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM events WHERE org_id=$1`,
      [organizerId]
    );

    res.json({
      page,
      perPage,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / perPage),
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.start_at,
        location: e.location,
        capacity: e.capacity,
        remaining: Math.max(0, e.capacity - e.claimed),
        status: e.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to load organizer events" });
  }
});

module.exports = router;
