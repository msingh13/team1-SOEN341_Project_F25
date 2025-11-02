const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

router.post("/events/:id/tickets", authenticateToken, async (req, res) => {
  const userId = req.user?.id || req.headers["x-user-id"];
  const eventId = parseInt(req.params.id, 10);
  if (!Number.isFinite(eventId)) return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });

  try {
    const { rows: evRows } = await pool.query(
      `SELECT id, capacity,
              (SELECT COUNT(*) FROM tickets WHERE event_id=$1 AND status='claimed') AS claimed
       FROM events WHERE id=$1 AND status='published'`, [eventId]);
    const ev = evRows[0];
    if (!ev) return res.status(404).json({ code: "NOT_FOUND", message: "Event not found or unpublished" });
    if (parseInt(ev.claimed) >= ev.capacity)
      return res.status(400).json({ code: "SOLD_OUT", message: "Tickets sold out" });

    const { rows: existing } = await pool.query(
      "SELECT id FROM tickets WHERE event_id=$1 AND user_id=$2", [eventId, userId]);
    if (existing.length) return res.status(400).json({ code: "ALREADY_CLAIMED", message: "You already claimed a ticket" });

    const qr = `${eventId}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const insert = await pool.query(
      `INSERT INTO tickets (event_id, user_id, qr_token, status)
       VALUES ($1,$2,$3,'claimed')
       RETURNING id, qr_token`, [eventId, userId, qr]);
    res.json({ ticketId: insert.rows[0].id, qrToken: insert.rows[0].qr_token, eventId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to claim ticket" });
  }
});

module.exports = router;
