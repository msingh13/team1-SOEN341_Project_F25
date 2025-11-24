// src/server/controllers/ticketsController.js
const pool = require("../db");

// ========================================================
// GET /me/tickets
// ========================================================
async function getMyTickets(req, res) {
  const userId = req.user?.id;

  if (!Number.isFinite(userId)) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing user" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        t.id            AS ticket_id,
        t.event_id      AS event_id,
        t.qr_token      AS qr_token,
        t.status        AS status,
        t.issued_at     AS issued_at,
        t.checked_in_at AS checked_in_at,
        e.title         AS title,
        e.start_at      AS start_at,
        e.end_at        AS end_at,
        e.location      AS location
      FROM tickets t
      JOIN events e ON e.id = t.event_id
      WHERE t.user_id = $1
      ORDER BY t.issued_at DESC NULLS LAST, t.id DESC
      `,
      [userId]
    );

    // Shape matches what MyTickets.tsx expects
    const formatted = rows.map(r => ({
      id: r.ticket_id,
      status: r.status,
      qrCode: r.qr_token,
      issuedAt: r.issued_at,
      checkedInAt: r.checked_in_at,
      eventId: r.event_id,
      event: {
        title: r.title,
        startAt: r.start_at,
        endAt: r.end_at,
        location: r.location
      }
    }));

    return res.json({ Tickets: formatted });
  } catch (err) {
    console.error("GET /me/tickets error:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to load tickets"
    });
  }
}

// ========================================================
// POST /tickets/validate
// (Organizer/Admin QR Scanning)
// ========================================================
async function validateTicket(req, res) {
  const token = (req.body?.token || "").trim();
  if (!token) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Missing QR token" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        t.id AS ticket_id,
        t.event_id,
        t.user_id,
        t.status,
        t.qr_token,
        t.checked_in_at,
        u.name  AS user_name,
        u.email AS user_email
      FROM tickets t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.qr_token = $1
      `,
      [token]
    );

    if (!rows.length) {
      return res.status(404).json({ code: "INVALID", message: "Invalid QR" });
    }

    const t = rows[0];

    // Already scanned
    if (t.checked_in_at) {
      return res.json({
        ok: false,
        status: "duplicate",
        message: "Already checked in",
        ticket: { id: t.ticket_id, eventId: t.event_id }
      });
    }

    // Mark as checked-in
    const upd = await pool.query(
      `
      UPDATE tickets
         SET status = 'checked_in',
             checked_in_at = NOW()
       WHERE id = $1
       RETURNING checked_in_at
      `,
      [t.ticket_id]
    );

    return res.json({
      ok: true,
      status: "valid",
      attendee: {
        id: t.user_id,
        name: t.user_name || null,
        email: t.user_email || null
      },
      ticket: {
        id: t.ticket_id,
        eventId: t.event_id,
        checkedInAt: upd.rows[0].checked_in_at
      }
    });

  } catch (err) {
    console.error("POST /tickets/validate error:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Validation failed"
    });
  }
}

module.exports = { getMyTickets, validateTicket };
