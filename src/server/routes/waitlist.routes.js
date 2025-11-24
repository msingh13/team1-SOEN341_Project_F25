// src/server/routes/waitlist.routes.js

const express = require("express");
const router = express.Router();

const pool = require("../db");

// Defensive import: supports default or named auth export
const authModule = require("../middleware/auth");
const authenticateToken = authModule.authenticateToken || authModule;
const requireApproved = authModule.requireApproved;

/* -----------------------------------------------------------
   Helper: Consistent error sender
----------------------------------------------------------- */
function sendError(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/* -----------------------------------------------------------
   Helper: Ensure event is SOLD OUT
----------------------------------------------------------- */
async function getEventIfSoldOut(eventId, res) {
  const { rows } = await pool.query(
    `
    SELECT e.id, e.capacity,
           COALESCE(
             (SELECT COUNT(*)
                FROM tickets t
               WHERE t.event_id = e.id
                 AND t.status IN ('claimed','checked_in')
             ), 0
           ) AS issued
      FROM events e
     WHERE e.id = $1
       AND e.status = 'published'
    `,
    [eventId]
  );

  const ev = rows[0];
  if (!ev) {
    sendError(res, 404, "NOT_FOUND", "Event not found or unpublished");
    return null;
  }

  if (ev.issued < ev.capacity) {
    sendError(res, 403, "NOT_SOLD_OUT", "Waitlist is only available for sold-out events");
    return null;
  }

  return ev;
}

/* -----------------------------------------------------------
   POST /events/:eventId/waitlist/join
----------------------------------------------------------- */
router.post(
  "/events/:eventId/waitlist/join",
  authenticateToken,
  requireApproved,
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const userId = req.user?.id;

      if (!Number.isFinite(eventId)) {
        return sendError(res, 400, "BAD_REQUEST", "Invalid event ID");
      }

      // Check sold-out
      const ev = await getEventIfSoldOut(eventId, res);
      if (!ev) return;

      // Check if already queued/offered
      const { rows: existing } = await pool.query(
        `
        SELECT id, status
          FROM waitlist_entries
         WHERE event_id = $1 AND user_id = $2
           AND status IN ('queued','offered')
        `,
        [eventId, userId]
      );

      if (existing.length > 0) {
        return res.json({
          success: true,
          status: existing[0].status,
          message: "Already in waitlist",
        });
      }

      // Insert into waitlist
      const insert = await pool.query(
        `
        INSERT INTO waitlist_entries (event_id, user_id, status)
        VALUES ($1, $2, 'queued')
        RETURNING id, joined_at
        `,
        [eventId, userId]
      );

      const joinedAt = insert.rows[0].joined_at;

      // Compute queue position
      const { rows: posRows } = await pool.query(
        `
        SELECT COUNT(*)::int AS before_me
          FROM waitlist_entries
         WHERE event_id = $1
           AND status = 'queued'
           AND joined_at < $2
        `,
        [eventId, joinedAt]
      );

      const position = posRows[0].before_me + 1;

      return res.json({
        success: true,
        status: "queued",
        position,
      });
    } catch (err) {
      console.error("🔥 WAITLIST JOIN ERROR:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Server error", err.message);
    }
  }
);

/* -----------------------------------------------------------
   POST /events/:eventId/waitlist/leave
----------------------------------------------------------- */
router.post(
  "/events/:eventId/waitlist/leave",
  authenticateToken,
  requireApproved,
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const userId = req.user?.id;

      if (!Number.isFinite(eventId)) {
        return sendError(res, 400, "BAD_REQUEST", "Invalid event ID");
      }

      // Must still require event to be sold-out (same rule as join)
      const ev = await getEventIfSoldOut(eventId, res);
      if (!ev) return;

      await pool.query(
        `DELETE FROM waitlist_entries WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );

      return res.json({ success: true });
    } catch (err) {
      console.error("🔥 WAITLIST LEAVE ERROR:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Server error", err.message);
    }
  }
);

/* -----------------------------------------------------------
   GET /events/:eventId/waitlist/status
----------------------------------------------------------- */
router.get(
  "/events/:eventId/waitlist/status",
  authenticateToken,
  requireApproved,
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const userId = req.user?.id;

      if (!Number.isFinite(eventId)) {
        return sendError(res, 400, "BAD_REQUEST", "Invalid event ID");
      }

      const ev = await getEventIfSoldOut(eventId, res);
      if (!ev) return;

      const { rows } = await pool.query(
        `
        SELECT status, joined_at
          FROM waitlist_entries
         WHERE event_id = $1 AND user_id = $2
        `,
        [eventId, userId]
      );

      if (rows.length === 0) {
        return res.json({ status: "not_joined", position: null });
      }

      const status = rows[0].status;
      const joinedAt = rows[0].joined_at;

      // Compute position (only for queued users)
      if (status === "queued") {
        const { rows: posRows } = await pool.query(
          `
          SELECT COUNT(*)::int AS before_me
            FROM waitlist_entries
           WHERE event_id = $1
             AND status = 'queued'
             AND joined_at < $2
          `,
          [eventId, joinedAt]
        );

        return res.json({
          status,
          position: posRows[0].before_me + 1,
        });
      }

      // If offered: no queue position
      return res.json({
        status: "offered",
        position: null,
      });
    } catch (err) {
      console.error("🔥 WAITLIST STATUS ERROR:", err);
      return sendError(res, 500, "INTERNAL_ERROR", "Server error", err.message);
    }
  }
);

module.exports = router;
