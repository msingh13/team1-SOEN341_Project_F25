const express = require("express");
const router = express.Router();
const pool = require("../db");

function currentUserId(req) {
  return Number(req.header("x-user-id") || 0) || 0;
}

// GET /me/saves
router.get("/saves", async (req, res) => {
  const uid = currentUserId(req);
  if (!uid) return res.status(401).json({ message: "No user" });

  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.category, e.organizer, e.location, e.start_time, e.end_time
       FROM saves s
       JOIN events e ON e.id = s.event_id
       WHERE s.user_id = $1
       ORDER BY e.start_time ASC`,
      [uid]
    );
    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /me/tickets
router.get("/tickets", async (req, res) => {
  const uid = currentUserId(req);
  if (!uid) return res.status(401).json({ message: "No user" });

  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.qr_code,
              e.id AS event_id, e.title AS event_title, e.location AS event_location, e.start_time AS event_start_at
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       WHERE t.user_id = $1
       ORDER BY t.claimed_at DESC`,
      [uid]
    );
    res.json({ tickets: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
