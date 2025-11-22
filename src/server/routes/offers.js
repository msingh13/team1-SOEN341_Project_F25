const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");


// ---- Debounce config (per user + event) ----
const DEBOUNCE_WINDOW_MS = 5000; // 5 seconds
const lastAcceptAttempts = new Map(); // key: `${userId}:${eventId}`

// POST /offers/:token/accept
// Full URL: POST http://localhost:5001/offers/:token/accept
router.post("/:token/accept", async (req, res) => {
  const { token } = req.params;
  console.log("Hit /offers/:token/accept with token:", token);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1) Lock the offer row so two requests can't race
    const offerResult = await client.query(
      `
      SELECT o.*, e.capacity, e.max_waitlist
      FROM offers o
      JOIN events e ON e.id = o.event_id
      WHERE o.token = $1
      FOR UPDATE
      `,
      [token]
    );

    if (offerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invalid offer token" });
    }

      const offer = offerResult.rows[0];

    // 2) Expiry check
    const now = new Date();
    if (offer.expires_at && new Date(offer.expires_at) < now) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Offer token has expired" });
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

    // 4) If already used, return existing ticket (idempotent)
    if (offer.used_by_ticket_id) {
      const existingTicketRes = await client.query(
        `SELECT * FROM tickets WHERE id = $1`,
        [offer.used_by_ticket_id]
      );
      const existingTicket = existingTicketRes.rows[0] || null;

      await client.query("COMMIT");
      return res.status(200).json({
        message: "Offer already accepted; returning existing ticket",
        ticket: existingTicket,
      });
    }


    // 5) Check event capacity + waitlist cap
    const ticketsSoldResult = await client.query(
      `SELECT COUNT(*) FROM tickets WHERE event_id = $1`,
      [offer.event_id]
    );
    const ticketsSold = Number(ticketsSoldResult.rows[0].count || 0);

    const eventCapacity = offer.capacity;
    const maxWaitlist = offer.max_waitlist ?? 0;
    const waitlistSize = 0; // TODO: replace with real waitlist COUNT(*) in a future sprint

    if (eventCapacity != null && ticketsSold >= eventCapacity) {
      // Event is at capacity → decide based on waitlist cap
      if (waitlistSize >= maxWaitlist) {
        await client.query("ROLLBACK");
        return res.status(429).json({
          error: "waitlist_full",
          message: "This event is at full capacity and its waitlist is full.",
        });
      }

      // TODO (future sprint): here is where you'd INSERT the user into the waitlist
      await client.query("ROLLBACK");
      return res.status(429).json({
        error: "waitlist_only",
        message: "This event is full. In a future version, you would be added to the waitlist.",
      });
    }



    // 6) Create a QR token for the ticket
    const qrToken = crypto.randomBytes(16).toString("hex");

    // 7) Try to insert a new ticket
    let ticket;
    try {
      const ticketInsertRes = await client.query(
        `
        INSERT INTO tickets (event_id, user_id, qr_token, status)
        VALUES ($1, $2, $3, 'claimed')
        RETURNING *
        `,
        [offer.event_id, offer.user_id, qrToken]
      );
      ticket = ticketInsertRes.rows[0];
    } catch (err) {
      // Unique constraint may fire (event_id, user_id) or qr_token
      // If a ticket already exists for this (event, user), reuse it (idempotent)
      if (err.code === "23505") {
        const existingTicketRes = await client.query(
          `
          SELECT *
          FROM tickets
          WHERE event_id = $1 AND user_id = $2
          `,
          [offer.event_id, offer.user_id]
        );
        ticket = existingTicketRes.rows[0];
      } else {
        throw err;
      }
    }

    if (!ticket) {
      throw new Error("Ticket insert failed and no existing ticket found");
    }

    // 8) Mark offer as used, linking to the ticket
    await client.query(
      `
      UPDATE offers
      SET used_at = NOW(), used_by_ticket_id = $1
      WHERE id = $2
      `,
      [ticket.id, offer.id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Offer accepted; ticket issued",
      ticket,
    });
  } catch (err) {
    console.error("Error in /offers/:token/accept:", err);
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Error during ROLLBACK:", rollbackErr);
    }
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
