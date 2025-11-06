const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

// POST /events/:id/tickets
router.post("/events/:id/tickets", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });
  }

  try {
    // Find published event + capacity + current issued count (claimed + checked_in)
    const { rows: evRows } = await pool.query(
      `SELECT e.id, e.capacity,
              COALESCE((
                SELECT COUNT(*)::int
                FROM tickets t
                WHERE t.event_id = e.id
                  AND t.status IN ('claimed','checked_in')
              ), 0) AS issued
       FROM events e
       WHERE e.id = $1 AND e.status = 'published'`,
      [eventId]
    );
    const ev = evRows[0];
    if (!ev) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Event not found or unpublished" });
    }
    if (ev.issued >= ev.capacity) {
      return res.status(400).json({ code: "SOLD_OUT", message: "Tickets sold out" });
    }

    // One per user per event
    const { rows: existing } = await pool.query(
      `SELECT id FROM tickets WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    if (existing.length) {
      return res.status(400).json({ code: "ALREADY_CLAIMED", message: "You already claimed a ticket" });
    }

    // Generate QR token (unique-ish)
    const qr = `${eventId}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Insert ticket with issued_at
    const { rows: ins } = await pool.query(
      `INSERT INTO tickets (event_id, user_id, qr_token, status, issued_at)
       VALUES ($1, $2, $3, 'claimed', NOW())
       RETURNING id, qr_token`,
      [eventId, userId, qr]
    );

    return res.json({ ticketId: ins[0].id, qrToken: ins[0].qr_token, eventId });
  } catch (err) {
    console.error("POST /events/:id/tickets error:", err);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to claim ticket" });
  }
});

module.exports = router;
