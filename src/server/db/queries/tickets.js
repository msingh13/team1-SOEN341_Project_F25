// src/server/db/queries/tickets.js
const crypto = require("crypto");

/**
 * Runs inside an existing transaction.
 * @param {import('pg').PoolClient} client
 * @param {{eventId:number, userId:number}} args
 */
async function claimTicketTx(client, { eventId, userId }) {
  // 1) Lock the event row for safe capacity/issued checks
  const evRes = await client.query(
    `SELECT id, published, capacity, issued
       FROM events
      WHERE id = $1
      FOR UPDATE`,
    [eventId]
  );

  if (evRes.rowCount === 0) {
    const e = new Error("Event not found");
    e.code = "NOT_FOUND";
    throw e;
  }

  const ev = evRes.rows[0];
  if (!ev.published) {
    const e = new Error("Event is not published");
    e.code = "NOT_PUBLISHED";
    throw e;
  }

  if (ev.capacity !== null && ev.issued >= ev.capacity) {
    const e = new Error("Event is sold out");
    e.code = "SOLD_OUT";
    throw e;
  }

  // 2) Prevent duplicate claim (same user & event)
  const dup = await client.query(
    `SELECT 1 FROM tickets WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId]
  );
  if (dup.rowCount > 0) {
    const e = new Error("User already claimed a ticket");
    e.code = "ALREADY_CLAIMED";
    throw e;
  }

  // 3) Insert ticket with unique QR token
  const qrToken = crypto.randomBytes(16).toString("hex");
  const tRes = await client.query(
    `INSERT INTO tickets (event_id, user_id, qr_token)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [eventId, userId, qrToken]
  );
  const ticketId = tRes.rows[0].id;

  // 4) Increment issued count
  await client.query(
    `UPDATE events SET issued = issued + 1 WHERE id = $1`,
    [eventId]
  );

  return { ticketId, qrToken };
}

module.exports = { claimTicketTx };
