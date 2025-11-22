const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");

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
      SELECT o.*, e.capacity
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

    // 3) If already used, return existing ticket (idempotent)
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

    // 4) Check event capacity
    const ticketsSoldResult = await client.query(
      `SELECT COUNT(*) FROM tickets WHERE event_id = $1`,
      [offer.event_id]
    );
    const ticketsSold = Number(ticketsSoldResult.rows[0].count || 0);

    if (offer.capacity != null && ticketsSold >= offer.capacity) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    // 5) Create a QR token for the ticket
    const qrToken = crypto.randomBytes(16).toString("hex");

    // 6) Try to insert a new ticket
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

    // 7) Mark offer as used, linking to the ticket
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
