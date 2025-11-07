// src/server/routes/events.metrics.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /events/:id/counters
// Public, read-only counters you can poll from any UI.
// remaining = capacity - claimed (claimed = tickets with issued_at IS NOT NULL)
router.get("/:id/counters", async (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.capacity,
        COALESCE(COUNT(t.id) FILTER (WHERE t.issued_at IS NOT NULL), 0) AS claimed_count,
        COALESCE(COUNT(t.id) FILTER (WHERE t.checked_in_at IS NOT NULL), 0) AS checked_in_count,
        GREATEST(
          e.capacity - COALESCE(COUNT(t.id) FILTER (WHERE t.issued_at IS NOT NULL), 0),
          0
        ) AS remaining
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
      `,
      [eventId]
    );

    if (!rows.length) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("events.counters error", err);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "DB error", details: err.message });
  }
});

module.exports = router;
