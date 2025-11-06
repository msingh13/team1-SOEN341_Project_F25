// src/server/controllers/ticketsController.js
const pool = require("../db");

async function getMyTickets(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const { rows } = await pool.query(
      `
      SELECT
        t.id              AS ticket_id,
        t.event_id        AS event_id,
        t.user_id         AS user_id,
        t.qr_token        AS qr_code,
        t.status          AS ticket_status,
        t.checked_in_at   AS checked_in_at,
        e.title           AS event_title,
        e.location        AS event_location,
        e.start_at        AS event_start_at,
        e.end_at          AS event_end_at,
        e.category        AS event_category,
        e.ticket_type     AS event_ticket_type,
        e.status          AS event_status
      FROM tickets t
      JOIN events e ON e.id = t.event_id
      WHERE t.user_id = $1
      ORDER BY t.issued_at DESC
      `,
      [userId]
    );

    const tickets = rows.map(r => ({
      id: r.ticket_id,
      qrCode: r.qr_code,
      status: r.ticket_status,
      checkedInAt: r.checked_in_at,
      event: {
        id: r.event_id,
        title: r.event_title,
        category: r.event_category,
        startAt: r.event_start_at,
        endAt: r.event_end_at,
        location: r.event_location,
        ticketType: r.event_ticket_type,
        status: r.event_status,
      },
    }));

    if (rows.length === 0) return res.status(404).json({ message: "No tickets found for this user" });

    res.status(200).json({ StudentId: userId, Tickets: tickets });
  } catch (error) {
    console.log("Error fetching tickets:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
}

module.exports = { getMyTickets };
