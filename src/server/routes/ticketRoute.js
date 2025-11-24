// src/server/routes/ticketRoute.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRoles } = require("../middleware/auth");

/**
 * Mounted in server.js as:
 *   const ticketRoute = require("./routes/ticketRoute");
 *   app.use(ticketRoute);
 *
 * Routes:
 *   GET /me/tickets   -> list tickets for logged-in user
 *   GET /me/waitlists -> list waitlist entries for logged-in user
 */

// Helpers ----------------------------------------------------

function rowsOrEmpty(result) {
  if (!result || !Array.isArray(result.rows)) return [];
  return result.rows;
}

// List my tickets --------------------------------------------

router.get(
  "/me/tickets",
  authenticateToken,
  requireRoles(["student", "organizer", "admin"]),
  async (req, res) => {
    const userId = req.user.id;

    try {
      const result = await pool.query(
        `
        SELECT
          t.id                       AS ticket_id,
          t.event_id,
          t.status,
          t.issued_at,
          t.checked_in_at,
          t.qr_token,
          e.title                    AS event_title,
          e.location                 AS event_location,
          e.start_at                 AS event_start,
          e.end_at                   AS event_end
        FROM tickets t
        JOIN events e ON e.id = t.event_id
        WHERE t.user_id = $1
        ORDER BY e.start_at DESC NULLS LAST, t.id DESC
      `,
        [userId]
      );

      const rows = rowsOrEmpty(result);
      return res.json(rows); // frontend expects array
    } catch (err) {
      console.error("GET /me/tickets error", err);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Failed to load tickets" });
    }
  }
);

// List my waitlists ------------------------------------------

router.get(
  "/me/waitlists",
  authenticateToken,
  requireRoles(["student", "organizer", "admin"]),
  async (req, res) => {
    const userId = req.user.id;

    try {
      const result = await pool.query(
        `
        SELECT
          w.id,
          w.event_id,
          w.created_at,
          e.title        AS event_title,
          e.location     AS event_location,
          e.start_at     AS event_start,
          e.end_at       AS event_end
        FROM waitlist_entries w
        JOIN events e ON e.id = w.event_id
        WHERE w.user_id = $1
        ORDER BY e.start_at DESC NULLS LAST, w.created_at ASC
      `,
        [userId]
      );

      const rows = rowsOrEmpty(result);
      return res.json(rows);
    } catch (err) {
      console.error("GET /me/waitlists error", err);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Failed to load waitlists" });
    }
  }
);

module.exports = router;
