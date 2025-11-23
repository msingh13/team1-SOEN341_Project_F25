// src/server/routes/saves.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireApproved } = require("../middleware/auth");

/**
 * POST /events/:id/save   -> save (bookmark) an event for the current user
 * DELETE /events/:id/save -> remove bookmark
 * GET /me/saves           -> list saved events for the current user
 *
 * Table expected:
 *   CREATE TABLE IF NOT EXISTS saves (
 *     user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *     event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     PRIMARY KEY (user_id, event_id)
 *   );
 */

// Add a save
router.post("/events/:id/save", authenticateToken, requireApproved, async (req, res) => {
  const userId = req.user.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });
  }
  try {
    await pool.query(
      `INSERT INTO saves (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, eventId]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("save error", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

// Remove a save
router.delete("/events/:id/save", authenticateToken, requireApproved, async (req, res) => {
  const userId = req.user.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });
  }
  try {
    await pool.query(`DELETE FROM saves WHERE user_id = $1 AND event_id = $2`, [userId, eventId]);
    return res.json({ ok: true });
  } catch (e) {
    console.error("unsave error", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

// List my saved events
router.get("/me/saves", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.location, e.start_at, e.end_at, e.category
         FROM saves s
         JOIN events e ON e.id = s.event_id
        WHERE s.user_id = $1
        ORDER BY e.start_at NULLS LAST, e.id`,
      [userId]
    );
    return res.json(rows);
  } catch (e) {
    console.error("list saves error", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

module.exports = router;
