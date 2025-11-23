// src/server/routes/events.waitlist.routes.js
const express = require("express");
const router = express.Router();

const pool = require("../db");
const { authenticateToken, requireApproved } = require("../middleware/auth");

// Helper for consistent error responses
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * Waitlist table (to be created via migration):
 *
 * CREATE TABLE IF NOT EXISTS event_waitlist (
 *   user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   event_id  INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 *   joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   PRIMARY KEY (user_id, event_id)
 * );
 *
 * Index suggestion:
 *   CREATE INDEX IF NOT EXISTS ix_event_waitlist_event_joined
 *     ON event_waitlist (event_id, joined_at);
 */

/**
 * Helper: fetch event + issued count and enforce "sold-out only"
 * Returns event row if sold out, otherwise sends an error and returns null.
 */
async function requireSoldOutEvent(eventId, res) {
  const { rows: evRows } = await pool.query(
    `
    SELECT e.id, e.capacity,
           COALESCE((
             SELECT COUNT(*)::int
             FROM tickets t
             WHERE t.event_id = e.id
               AND t.status IN ('claimed','checked_in')
           ), 0) AS issued
      FROM events e
     WHERE e.id = $1
       AND e.status = 'published'
    `,
    [eventId]
  );
  const ev = evRows[0];
  if (!ev) {
    sendError(res, 404, "NOT_FOUND", "Event not found or unpublished");
    return null;
  }
  if (ev.issued < ev.capacity) {
    sendError(res, 403, "NOT_SOLD_OUT", "Waitlist only available for sold-out events");
    return null;
  }
  return ev;
}

/**
 * POST /events/:id/waitlist/join
 * - Verified (approved) users only
 * - Event must be sold out
 * - User cannot join multiple times
 * - Returns 201 with current position
 */
router.post(
  "/events/:id/waitlist/join",
  authenticateToken,
  requireApproved,
  async (req, res) => {
    const userId = req.user?.id;
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
    }

    try {
      // Enforce "sold-out only"
      const ev = await requireSoldOutEvent(eventId, res);
      if (!ev) return; // error already sent

      // Prevent joining multiple times
      const { rows: existing } = await pool.query(
        `SELECT user_id FROM event_waitlist WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      if (existing.length) {
        return sendError(res, 403, "ALREADY_IN_WAITLIST", "You are already in the waitlist for this event");
      }

      // Insert into waitlist
      const { rows: insertedRows } = await pool.query(
        `INSERT INTO event_waitlist (user_id, event_id)
         VALUES ($1, $2)
         RETURNING joined_at`,
        [userId, eventId]
      );
      const joinedAt = insertedRows[0].joined_at;

      // Compute position (1-based) at the time of join
        const { rows: posRows } = await pool.query(
        `
        SELECT COUNT(*)::int AS before_me
            FROM event_waitlist
        WHERE event_id = $1
            AND joined_at < $2
        `,
        [eventId, joinedAt]
        );
        const position = posRows[0].before_me + 1;


      return res.status(201).json({
        state: "waiting",
        position,
      });
    } catch (err) {
      console.error("POST /events/:id/waitlist/join error:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to join waitlist");
    }
  }
);

/**
 * DELETE /events/:id/waitlist/leave
 * - Verified (approved) users only
 * - Event must be sold out (same guard as join)
 * - Always returns 204 (no content)
 */
router.delete(
  "/events/:id/waitlist/leave",
  authenticateToken,
  requireApproved,
  async (req, res) => {
    const userId = req.user?.id;
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
    }

    try {
      const ev = await requireSoldOutEvent(eventId, res);
      if (!ev) return; // error already sent

      await pool.query(
        `DELETE FROM event_waitlist WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );

      // Even if nothing was deleted, 204 is fine
      return res.status(204).send();
    } catch (err) {
      console.error("DELETE /events/:id/waitlist/leave error:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to leave waitlist");
    }
  }
);

/**
 * GET /events/:id/waitlist/status
 * - Verified (approved) users only
 * - Event must be sold out
 * - Returns { state: "not_joined" | "waiting", position: number | null }
 */
router.get(
  "/events/:id/waitlist/status",
  authenticateToken,
  requireApproved,
  async (req, res) => {
    const userId = req.user?.id;
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return sendError(res, 400, "BAD_REQUEST", "Invalid event id");
    }

    try {
      const ev = await requireSoldOutEvent(eventId, res);
      if (!ev) return; // error already sent

      const { rows: entryRows } = await pool.query(
        `SELECT joined_at FROM event_waitlist WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      const entry = entryRows[0];

      if (!entry) {
        return res.json({
          state: "not_joined",
          position: null,
        });
      }

      const joinedAt = entry.joined_at;

        const { rows: posRows } = await pool.query(
        `
        SELECT COUNT(*)::int AS before_me
            FROM event_waitlist
        WHERE event_id = $1
            AND joined_at < $2
        `,
        [eventId, joinedAt]
        );
        const position = posRows[0].before_me + 1;


      return res.json({
        state: "waiting",
        position,
      });
    } catch (err) {
      console.error("GET /events/:id/waitlist/status error:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to get waitlist status");
    }
  }
);

module.exports = router;