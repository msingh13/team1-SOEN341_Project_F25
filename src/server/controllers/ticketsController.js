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
async function validateTicket(req, res) {
  try{
    const user = req.user||{};
    if(!user||!['organizer', 'admin'].includes(user.role)){
      return res.status(403).json({message: 'Forbidden: Insufficient permissions'});
  }
  if (!user.org_id) {
    return res.status(400).json({ message: "Organizer must be associated with an organization" });
  }
  const token = (req.body && req.body.token)||''.trim();
  if (!token) {
    return res.status(400).json({ message: "QR token is required" });
  }
  // start a transaction
await pool.query('BEGIN');

const q = `
  SELECT
    t.id, t.user_id, t.event_id, t.qr_token, t.status, t.checked_in_at,
    e.title AS event_title, e.org_id, e.status AS event_status
  FROM tickets t
  JOIN events e ON e.id = t.event_id
  WHERE t.qr_token = $1
    AND e.org_id = $2
    AND e.status IN ('submitted','published')   
    AND t.status IN ('valid','claimed')         
  FOR UPDATE
`;

const { rows } = await pool.query(q, [token, user.org_id]);
if (rows.length === 0) {
  await pool.query('ROLLBACK');
  return res.status(404).json({ message: 'Ticket not found or invalid for this organization' });
}

const t = rows[0];


if (t.checked_in_at) {
  await pool.query('COMMIT');
  return res.status(409).json({
    message: 'Ticket has already been checked in',
    status: 'Duplicate',
    ticket: { id: t.id, eventId: t.event_id, checkedInAt: t.checked_in_at },
  });
}


const upd = await pool.query(
  `UPDATE tickets
     SET checked_in_at = NOW()            
   WHERE id = $1
   RETURNING checked_in_at`,
  [t.id] // , user.id
);

await pool.query('COMMIT');
return res.status(200).json({
  message: 'Ticket successfully checked in',
  status: 'valid',
  ticket: {
    id: t.id,
    eventId: t.event_id,
    checkedInAt: upd.rows[0].checked_in_at,
  },
  event: { id: t.event_id, title: t.event_title },
});

}catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error validating ticket:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
}

module.exports = { getMyTickets, validateTicket };
