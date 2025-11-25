const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

const { authenticateToken, requireRoles } = require("../middleware/auth");
const requireOrganizer = requireRoles("organizer");

// Helper
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * GET /events/:id/waitlist
 * Organizer view of waitlist entries for an event.
 */
router.get(
  "/:id/waitlist",
  authenticateToken,
  requireOrganizer,
  async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isFinite(eventId)) {
      return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
    }

    try {
      const { rows: evRows } = await pool.query(
        "SELECT id FROM events WHERE id = $1",
        [eventId]
      );
      if (evRows.length === 0) {
        return sendError(res, 404, "NOT_FOUND", "Event not found");
      }

      const { rows: waitlistRows } = await pool.query(
        `
        SELECT
          w.id,
          w.status,
          w.position,
          w.created_at,
          u.name  AS user_name,
          u.id    AS user_id,
          u.email AS email
        FROM event_waitlist w
        JOIN users AS u ON u.id = w.user_id
        WHERE w.event_id = $1
        ORDER BY w.position ASC, w.created_at ASC, w.id ASC
        `,
        [eventId]
      );

      return res.json({ waitlist: waitlistRows });
    } catch (e) {
      console.error("GET /:id/waitlist error:", e);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to retrieve waitlist");
    }
  }
);

/**
 * POST /events/:id/waitlist/promote
 * Body: { userId }
 * - Check capacity
 * - Promote queued user -> create ticket
 * - Write audit log
 */
router.post(
  "/:id/waitlist/promote",
  authenticateToken,
  requireOrganizer,
  async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    const { userId } = req.body || {};
    const actorID = req.user.id;

    if (!Number.isFinite(eventId)) {
      return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
    }
    if (!Number.isFinite(Number(userId))) {
      return sendError(res, 400, "BAD_REQUEST", "Invalid userId");
    }

    const client = await pool.connect();
    try {
      // Start transaction
      await client.query("BEGIN");

      // Lock event row
      const { rows: evRows } = await client.query(
        "SELECT id, capacity FROM events WHERE id = $1 FOR UPDATE",
        [eventId]
      );
      if (evRows.length === 0) {
        await client.query("ROLLBACK");
        return sendError(res, 404, "NOT_FOUND", "Event not found");
      }
      const capacity = evRows[0].capacity;

      // Count existing tickets
      const { rows: ticketCountRows } = await client.query(
        `
        SELECT COUNT(*) AS count
          FROM tickets
         WHERE event_id = $1
           AND status != 'canceled'
        `,
        [eventId]
      );
      const used = parseInt(ticketCountRows[0].count, 10);
      if (used >= capacity) {
        await client.query("ROLLBACK");
        return sendError(res, 400, "BAD_REQUEST", "Event is at full capacity");
      }

      // Lock waitlist entry
      const { rows: waitlistRows } = await client.query(
        `
        SELECT id, user_id, status, position
          FROM event_waitlist
         WHERE event_id = $1
           AND user_id = $2
         FOR UPDATE
        `,
        [eventId, userId]
      );
      if (waitlistRows.length === 0) {
        await client.query("ROLLBACK");
        return sendError(res, 404, "NOT_FOUND", "User not found in waitlist");
      }
      const waitlistEntry = waitlistRows[0];
      if (waitlistEntry.status !== "queued") {
        await client.query("ROLLBACK");
        return sendError(
          res,
          400,
          "BAD_REQUEST",
          "Can only promote queued users"
        );
      }

      // Update waitlist entry status
      await client.query(
        `
        UPDATE event_waitlist
           SET status = 'promoted',
               updated_at = NOW()
         WHERE id = $1
        `,
        [waitlistEntry.id]
      );

      // Create ticket
      const qrToken = uuidv4();
      const { rows: ticketRows } = await client.query(
        `
        INSERT INTO tickets (event_id, user_id, status, qr_token, issued_at)
        VALUES ($1, $2, 'claimed', $3, NOW())
        RETURNING id, status, qr_token, issued_at
        `,
        [eventId, userId, qrToken]
      );

      // Audit
      await client.query(
        `
        INSERT INTO event_waitlist_audit (event_id, waitlist_id, actor_id, action)
        VALUES ($1, $2, $3, 'promote')
        `,
        [eventId, waitlistEntry.id, actorID]
      );

      await client.query("COMMIT");
      return res.json({ ticket: ticketRows[0] });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("POST /:id/waitlist/promote error:", e);
      return sendError(res, 500, "INTERNAL_ERROR", "Server error");
    } finally {
      client.release();
    }
  }
);

/**
 * DELETE /events/:id/waitlist/:entryId
 * - Mark entry as removed
 * - Audit
 */
router.delete(
  "/:id/waitlist/:entryId",
  authenticateToken,
  requireOrganizer,
  async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    const entryId = parseInt(req.params.entryId, 10);
    const actorID = req.user.id;

    if (!Number.isFinite(eventId) || !Number.isFinite(entryId)) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Invalid event or entry id"
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: evRows } = await client.query(
        `
        SELECT w.id
          FROM event_waitlist w
          JOIN events e ON e.id = w.event_id
         WHERE w.event_id = $1
           AND w.id = $2
         FOR UPDATE
        `,
        [eventId, entryId]
      );
      if (evRows.length === 0) {
        await client.query("ROLLBACK");
        return sendError(
          res,
          404,
          "NOT_FOUND",
          "Waitlist entry not found for this event"
        );
      }

      await client.query(
        `
        UPDATE event_waitlist
           SET status = 'removed',
               updated_at = NOW()
         WHERE id = $1
        `,
        [entryId]
      );

      await client.query(
        `
        INSERT INTO event_waitlist_audit (event_id, waitlist_id, actor_id, action)
        VALUES ($1, $2, $3, 'remove')
        `,
        [eventId, entryId, actorID]
      );

      await client.query("COMMIT");
      return res.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("DELETE /:id/waitlist/:entryId error:", e);
      return sendError(res, 500, "INTERNAL_ERROR", "Server error");
    } finally {
      client.release();
    }
  }
);

module.exports = router;
