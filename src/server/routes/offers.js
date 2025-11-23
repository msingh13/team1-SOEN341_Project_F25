const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");

// ---- Debounce config (per user + event) ----
const DEBOUNCE_WINDOW_MS = 5000; // 5 seconds
const lastAcceptAttempts = new Map(); // key: `${userId}:${eventId}`

// POST /offers/:token/accept
router.post("/:token/accept", async (req, res) => {
  const { token } = req.params;
  console.log("Hit /offers/:token/accept with token:", token);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1) Lock the offer row
    const offerResult = await client.query(
      `SELECT o.*, e.capacity, e.max_waitlist
       FROM offers o
       JOIN events e ON e.id = o.event_id
       WHERE o.token = $1
       FOR UPDATE`,
      [token]
    );

    const offer = offerResult.rows[0];
    if (!offer) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "invalid_offer" });
    }

    // 3) Per-user debounce BEFORE anything else
    const debounceKey = `${offer.user_id}:${offer.event_id}`;
    const nowMs = Date.now();
    const lastTime = lastAcceptAttempts.get(debounceKey);

    if (lastTime && nowMs - lastTime < DEBOUNCE_WINDOW_MS) {
      await client.query("ROLLBACK");
      return res.status(429).json({
        error: "too_many_requests",
        message: "You're trying to accept this offer too quickly. Please wait a moment and try again.",
      });
    }

    // Record the attempt
    lastAcceptAttempts.set(debounceKey, nowMs);

    // 4) If already used → idempotent return
    const usedTicket = await client.query(
      `SELECT id, event_id FROM tickets WHERE offer_id = $1`,
      [offer.id]
    );
    if (usedTicket.rows.length) {
      await client.query("COMMIT");
      return res.json({
        idempotent: true,
        ticket: usedTicket.rows[0],
      });
    }

    // 5) Check capacity + waitlist
    const eventCapacity = offer.capacity;
    const maxWaitlist = offer.max_waitlist ?? 0;
    const waitlistSize = 0; // TODO: implement real waitlist COUNT

    const sold = await client.query(
      `SELECT COUNT(*)::int AS c FROM tickets WHERE event_id = $1`,
      [offer.event_id]
    );
    const ticketsSold = sold.rows[0].c;

    if (eventCapacity != null && ticketsSold >= eventCapacity) {
      if (waitlistSize >= maxWaitlist) {
        await client.query("ROLLBACK");
        return res.status(429).json({
          error: "waitlist_full",
          message: "This event is at full capacity and its waitlist is full.",
        });
      }

      await client.query("ROLLBACK");
      return res.status(429).json({
        error: "waitlist_only",
        message: "This event is full. In a future version, you would be added to the waitlist.",
      });
    }

    // 6) Create QR token
    const qrToken = crypto.randomBytes(16).toString("hex");

    // 7) Insert a new ticket
    const insertTicket = await client.query(
      `INSERT INTO tickets (event_id, user_id, qr_token, offer_id, status, issued_at)
       VALUES ($1, $2, $3, $4, 'claimed', NOW())
       RETURNING id, event_id, user_id, qr_token`,
      [offer.event_id, offer.user_id, qrToken, offer.id]
    );

    // 8) Mark offer as used
    await client.query(
      `UPDATE offers SET used_at = NOW() WHERE id = $1`,
      [offer.id]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      ticket: insertTicket.rows[0],
    });

  } catch (err) {
    console.error("ERROR accept offer:", err);
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "server_error" });
  } finally {
    client.release();
  }
});

module.exports = router;

