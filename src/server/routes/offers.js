// server/routes/offers.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../db");

// Small helper for consistent error responses
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * POST /offers/:token/accept
 *
 * This endpoint is used when a student clicks an email link
 * like `/offers/<offer_token>/accept`.
 *
 * It:
 *  - Finds the matching waitlist entry by offer_token
 *  - Verifies it is still "offered" and not expired
 *  - Checks that the event still has capacity
 *  - Ensures the user doesn't already have a ticket
 *  - Creates a ticket
 *  - Marks the waitlist entry as "converted"
 *  - (Optionally) logs the action in moderation_log if that table exists
 */
router.post("/:token/accept", async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    return sendError(res, 400, "BAD_REQUEST", "Missing or invalid offer token");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Lock the waitlist entry by token
    const wlResult = await client.query(
      `
      SELECT
        w.id,
        w.user_id,
        w.event_id,
        w.status,
        w.offer_expires_at,
        e.capacity
      FROM event_waitlists w
      JOIN events e ON e.id = w.event_id
      WHERE w.offer_token = $1
      FOR UPDATE
      `,
      [token]
    );

    const waitlist = wlResult.rows[0];

    if (!waitlist) {
      await client.query("ROLLBACK");
      return sendError(res, 400, "INVALID_OFFER", "Offer token is invalid or no longer exists");
    }

    // 2) Handle non-"offered" statuses in an idempotent way
    if (waitlist.status === "converted") {
      // Try to find an existing ticket (idempotent behaviour)
      const existingTicket = await client.query(
        `
        SELECT id, event_id, user_id, qr_token, issued_at
        FROM tickets
        WHERE event_id = $1 AND user_id = $2
        ORDER BY issued_at DESC NULLS LAST, id DESC
        LIMIT 1
        `,
        [waitlist.event_id, waitlist.user_id]
      );

      await client.query("COMMIT");
      if (existingTicket.rows.length) {
        return res.json({
          ok: true,
          idempotent: true,
          ticket: existingTicket.rows[0],
        });
      }

      // No ticket found, but status is converted → treat as invalid/used
      return sendError(res, 400, "OFFER_ALREADY_USED", "This offer has already been used");
    }

    if (waitlist.status !== "offered") {
      await client.query("ROLLBACK");
      return sendError(
        res,
        400,
        "INVALID_STATUS",
        `Offer is not in an 'offered' state (current: ${waitlist.status})`
      );
    }

    // 3) Check expiry
    if (waitlist.offer_expires_at && waitlist.offer_expires_at <= new Date()) {
      // Mark as expired
      await client.query(
        `
        UPDATE event_waitlists
        SET status = 'expired',
            offer_token = NULL
        WHERE id = $1
        `,
        [waitlist.id]
      );

      await client.query("COMMIT");
      return sendError(res, 400, "OFFER_EXPIRED", "This offer has expired");
    }

    // 4) Check if the user already has a ticket for this event
    const existingTicket = await client.query(
      `
      SELECT id, event_id, user_id, qr_token, issued_at
      FROM tickets
      WHERE event_id = $1
        AND user_id = $2
        AND status IN ('claimed','checked_in')
      ORDER BY issued_at DESC NULLS LAST, id DESC
      LIMIT 1
      `,
      [waitlist.event_id, waitlist.user_id]
    );

    if (existingTicket.rows.length) {
      // User already has a ticket → mark waitlist as converted & return idempotently
      await client.query(
        `
        UPDATE event_waitlists
        SET status = 'converted',
            offer_token = NULL,
            offer_expires_at = NULL
        WHERE id = $1
        `,
        [waitlist.id]
      );

      await client.query("COMMIT");
      return res.json({
        ok: true,
        idempotent: true,
        ticket: existingTicket.rows[0],
      });
    }

    // 5) Re-check capacity
    const countResult = await client.query(
      `
      SELECT COUNT(*)::int AS claimed
      FROM tickets
      WHERE event_id = $1
        AND status IN ('claimed','checked_in')
      `,
      [waitlist.event_id]
    );
    const claimed = countResult.rows[0]?.claimed ?? 0;
    const capacity = waitlist.capacity;

    if (capacity != null && claimed >= capacity) {
      // Event is at capacity → expire this offer
      await client.query(
        `
        UPDATE event_waitlists
        SET status = 'expired',
            offer_token = NULL,
            offer_expires_at = NULL
        WHERE id = $1
        `,
        [waitlist.id]
      );

      await client.query("COMMIT");
      return sendError(
        res,
        409,
        "EVENT_FULL",
        "This event has reached full capacity; the offer can no longer be used."
      );
    }

    // 6) Generate a QR token for the new ticket
    const qrToken = crypto.randomBytes(16).toString("hex");

    // 7) Insert ticket
    const insertTicket = await client.query(
      `
      INSERT INTO tickets (event_id, user_id, qr_token, status, issued_at)
      VALUES ($1, $2, $3, 'claimed', NOW())
      RETURNING id, event_id, user_id, qr_token, issued_at
      `,
      [waitlist.event_id, waitlist.user_id, qrToken]
    );
    const ticket = insertTicket.rows[0];

    // 8) Mark waitlist entry as converted
    await client.query(
      `
      UPDATE event_waitlists
      SET status = 'converted',
          offer_token = NULL,
          offer_expires_at = NULL
      WHERE id = $1
      `,
      [waitlist.id]
    );

    // 9) Best-effort audit log (won't break flow if it fails)
    try {
      await client.query(
        `
        INSERT INTO moderation_log (admin_id, target_type, target_id, action, details)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        `,
        [
          null,
          "event_waitlist",
          waitlist.id,
          "waitlist_offer_accepted",
          JSON.stringify({
            event_id: waitlist.event_id,
            user_id: waitlist.user_id,
            ticket_id: ticket.id,
          }),
        ]
      );
    } catch (logErr) {
      // Don't fail the whole request because of a logging error
      console.warn("Failed to write waitlist_offer_accepted log:", logErr.message);
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      ticket,
    });
  } catch (err) {
    console.error("ERROR /offers/:token/accept:", err);
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to accept offer");
  } finally {
    client.release();
  }
});

module.exports = router;
