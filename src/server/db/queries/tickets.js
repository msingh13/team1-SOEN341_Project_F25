const { pool } = require('../index');
const crypto = require('crypto');

async function withClient(fn) {
  const client = await pool.connect();
  try { return await fn(client); }
  finally { client.release(); }
}

async function generateToken() {
  return crypto.randomBytes(16).toString('hex'); // 32-char hex
}

exports.claimTicketTx = (eventId, userId) => withClient(async (client) => {
  await client.query('BEGIN');

  // Lock the event so capacity/issued stays consistent
  const evRes = await client.query(
    `SELECT id, published, capacity, issued
       FROM events
      WHERE id = $1
      FOR UPDATE`,
    [eventId]
  );
  if (evRes.rowCount === 0) {
    await client.query('ROLLBACK');
    return { error: { status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' } };
  }
  const ev = evRes.rows[0];

  if (!ev.published) {
    await client.query('ROLLBACK');
    return { error: { status: 400, code: 'UNPUBLISHED', message: 'Event is not published' } };
  }
  if (ev.capacity !== null && ev.issued >= ev.capacity) {
    await client.query('ROLLBACK');
    return { error: { status: 400, code: 'SOLD_OUT', message: 'Tickets sold out' } };
  }

  // Prevent duplicate claim by same user
  const dup = await client.query(
    `SELECT 1 FROM tickets WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId]
  );
  if (dup.rowCount > 0) {
    await client.query('ROLLBACK');
    return { error: { status: 400, code: 'ALREADY_CLAIMED', message: 'User already claimed a ticket' } };
  }

  // Insert ticket with unique qr_token (retry once if token collides)
  let ticket;
  for (let i = 0; i < 2; i++) {
    const token = await generateToken();
    try {
      const tRes = await client.query(
        `INSERT INTO tickets (event_id, user_id, qr_token)
         VALUES ($1, $2, $3)
         RETURNING id, qr_token, issued_at AS created_at`,
        [eventId, userId, token]
      );
      ticket = tRes.rows[0];
      break;
    } catch (e) {
      // unique violation on qr_token -> retry
      if (e.code !== '23505') throw e;
    }
  }
  if (!ticket) {
    await client.query('ROLLBACK');
    return { error: { status: 500, code: 'TOKEN_GEN_FAILED', message: 'Could not generate QR token' } };
  }

  await client.query(`UPDATE events SET issued = issued + 1 WHERE id = $1`, [eventId]);
  await client.query('COMMIT');

  return { ticket };
});