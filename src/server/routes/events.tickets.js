// src/server/routes/events.tickets.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const pool = require("../db");
const { authenticateToken, requireRoles } = require("../middleware/auth");

/**
 * POST /events/:id/claim
 * Requires: JWT auth, role = student (or organizer/admin for testing)
 * Returns: { ok, ticket_id, token, event_title, event_start, location, status }
 */

// helper: get event + simple capacity info
async function getEventWithUsage(eventId) {
  const evRes = await pool.query(
    `SELECT id, title, start_at, location, capacity, status
       FROM events
      WHERE id = $1`,
    [eventId]
  );
  if (!evRes.rowCount) return null;

  const event = evRes.rows[0];

  const capRes = await pool.query(
    `SELECT COUNT(*)::int AS issued
       FROM tickets
      WHERE event_id = $1`,
    [eventId]
  );

  const issued = capRes.rows[0]?.issued ?? 0;
  return { event, issued };
}

router.post(
  "/events/:id/claim",
  authenticateToken,
  requireRoles(["student", "organizer", "admin"]), // mainly student, others allowed for testing
  async (req, res) => {
    const userId = req.user.id;
    const eventId = Number(req.params.id);

    if (!Number.isFinite(eventId)) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Invalid event id" });
    }

    try {
      // 1) Check if ticket already exists for this user + event
      const existing = await pool.query(
        `SELECT id, status, issued_at, checked_in_at, qr_token
           FROM tickets
          WHERE user_id = $1 AND event_id = $2
          LIMIT 1`,
        [userId, eventId]
      );

      if (existing.rowCount) {
        return res.status(400).json({
          ok: false,
          code: "ALREADY_CLAIMED",
          message: "You already claimed a ticket for this event.",
        });
      }

      // 2) Load event & capacity usage
      const info = await getEventWithUsage(eventId);
      if (!info) {
        return res
          .status(404)
          .json({ ok: false, code: "NOT_FOUND", message: "Event not found" });
      }

      const { event, issued } = info;

      // Optional: only allow published events
      if (event.status && event.status !== "published") {
        return res.status(400).json({
          ok: false,
          code: "INVALID_STATUS",
          message: "Event is not open for ticket claiming.",
        });
      }

      // 3) Capacity check (simple: issued >= capacity)
      if (event.capacity != null && issued >= Number(event.capacity)) {
        return res.status(400).json({
          ok: false,
          code: "SOLD_OUT",
          message: "This event is sold out.",
        });
      }

      // 4) Create ticket
      const token = crypto.randomBytes(16).toString("hex");

      const tRes = await pool.query(
        `INSERT INTO tickets (user_id, event_id, qr_token, status, issued_at)
         VALUES ($1, $2, $3, 'claimed', NOW())
         RETURNING id, qr_token, status, issued_at`,
        [userId, eventId, token]
      );

      const ticket = tRes.rows[0];

      return res.json({
        ok: true,
        ticket_id: ticket.id,
        token: ticket.qr_token,
        event_title: event.title,
        event_start: event.start_at,
        location: event.location,
        status: ticket.status || "claimed",
      });
    } catch (err) {
      console.error("claim ticket error", err);
      return res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Server error while claiming ticket.",
      });
    }
  }
);

module.exports = router;
