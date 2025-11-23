// src/server/routes/events.tickets.js
const express = require("express");
const router = express.Router();

const pool = require("../db");
const { authenticateToken } = require("../middleware/auth"); // only this is required

// --- local guard: organizer or admin required ---
function requireOrganizerOrAdmin(req, res, next) {
  // assuming your auth middleware sets req.user = { id, role, ... }
  const role = req.user?.role;
  if (role === "organizer" || role === "admin") return next();
  return res
    .status(403)
    .json({ code: "FORBIDDEN", message: "Organizer or admin required" });
}

function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * POST /events/:id/tickets
 * Claim ticket (issued = claimed OR checked_in).
 */
router.post("/events/:id/tickets", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
  }

  try {
    const { rows: evRows } = await pool.query(
      `
      SELECT e.id, e.capacity,
             COALESCE((
               SELECT COUNT(*)::int
               FROM tickets t
               WHERE t.event_id = e.id
                 AND t.status IN ('claimed','checked_in')
             ), 0) AS issued
        FROM events e
       WHERE e.id = $1
         AND e.status = 'published'
      `,
      [eventId]
    );
    const ev = evRows[0];
    if (!ev) return sendError(res, 404, "NOT_FOUND", "Event not found or unpublished");
    if (ev.issued >= ev.capacity) return sendError(res, 400, "SOLD_OUT", "Tickets sold out");

    const { rows: existing } = await pool.query(
      `SELECT id FROM tickets WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    if (existing.length) return sendError(res, 400, "ALREADY_CLAIMED", "You already claimed a ticket");

    const qr = `${eventId}.${userId}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;

    const { rows: ins } = await pool.query(
      `INSERT INTO tickets (event_id, user_id, qr_token, status, issued_at)
       VALUES ($1, $2, $3, 'claimed', NOW())
       RETURNING id, event_id, qr_token, issued_at`,
      [eventId, userId, qr]
    );

    return res.json({
      ticketId: ins[0].id,
      eventId: ins[0].event_id,
      qrToken: ins[0].qr_token,
      issued_at: ins[0].issued_at,
    });
  } catch (err) {
    console.error("POST /events/:id/tickets error:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to claim ticket");
  }
});

/**
 * GET /me/tickets
 * Returns current user's tickets (shape compatible with MyTickets.tsx).
 */
router.get("/me/tickets", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        t.id,
        t.status,
        t.qr_token    AS "qrCode",
        t.issued_at   AS "issuedAt",
        t.checked_in_at AS "checkedInAt",
        e.id          AS "eventId",
        e.title       AS "eventTitle",
        e.location    AS "eventLocation",
        e.start_at    AS "eventStartAt",
        e.end_at      AS "eventEndAt"
      FROM tickets t
      JOIN events  e ON e.id = t.event_id
      WHERE t.user_id = $1
      ORDER BY t.issued_at DESC NULLS LAST, t.id DESC
      `,
      [userId]
    );

    const Tickets = rows.map((r) => ({
      id: r.id,
      status: r.status,
      qrCode: r.qrCode,
      issuedAt: r.issuedAt,
      checkedInAt: r.checkedInAt,
      ev: { title: r.eventTitle },
      event: { startAt: r.eventStartAt, endAt: r.eventEndAt, location: r.eventLocation },
    }));

    return res.json({ Tickets });
  } catch (err) {
    console.error("GET /me/tickets error:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to load tickets");
  }
});

/**
 * POST /org/tickets/validate
 * { token } → checks QR, sets checked_in
 */
router.post(
  "/org/tickets/validate",
  authenticateToken,
  requireOrganizerOrAdmin,
  async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") {
      return sendError(res, 400, "BAD_REQUEST", "Missing QR token");
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, status, event_id, user_id, checked_in_at FROM tickets WHERE qr_token = $1`,
        [token]
      );
      const t = rows[0];
      if (!t) return sendError(res, 400, "INVALID", "Invalid QR");

      if (t.status === "checked_in" || t.checked_in_at) {
        return res.json({
          ok: false,
          status: "duplicate",
          message: "Already checked in",
          ticket: { id: t.id, eventId: t.event_id },
        });
      }

      const { rows: up } = await pool.query(
        `UPDATE tickets
            SET status = 'checked_in', checked_in_at = NOW()
          WHERE id = $1
        RETURNING id, event_id, user_id, checked_in_at`,
        [t.id]
      );
      const checked = up[0];

      const { rows: userRows } = await pool.query(
        `SELECT id, name, email FROM users WHERE id = $1`,
        [checked.user_id]
      );
      const attendee = userRows[0] || { id: checked.user_id };

      return res.json({
        ok: true,
        status: "valid",
        attendee,
        ticket: { id: checked.id, eventId: checked.event_id, checkedInAt: checked.checked_in_at },
      });
    } catch (err) {
      console.error("POST /org/tickets/validate error:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Server error");
    }
  }
);

// Alias so the client path /tickets/validate works too
router.post(
  "/tickets/validate",
  authenticateToken,
  requireOrganizerOrAdmin,
  async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Missing QR token" });
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, status, event_id, user_id, checked_in_at FROM tickets WHERE qr_token = $1`,
        [token]
      );
      const t = rows[0];
      if (!t) return res.status(400).json({ code: "INVALID", message: "Invalid QR" });

      if (t.status === "checked_in" || t.checked_in_at) {
        return res.json({
          ok: false,
          status: "duplicate",
          message: "Already checked in",
          ticket: { id: t.id, eventId: t.event_id },
        });
      }

      const { rows: up } = await pool.query(
        `UPDATE tickets
            SET status = 'checked_in', checked_in_at = NOW()
          WHERE id = $1
        RETURNING id, event_id, user_id, checked_in_at`,
        [t.id]
      );
      const checked = up[0];

      const { rows: userRows } = await pool.query(
        `SELECT id, name, email FROM users WHERE id = $1`,
        [checked.user_id]
      );
      const attendee = userRows[0] || { id: checked.user_id };

      return res.json({
        ok: true,
        status: "valid",
        attendee,
        ticket: { id: checked.id, eventId: checked.event_id, checkedInAt: checked.checked_in_at },
      });
    } catch (err) {
      console.error("POST /tickets/validate error:", err);
      return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

module.exports = router;
