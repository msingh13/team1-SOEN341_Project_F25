// src/server/routes/admin.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// Make sure these are real functions. Fallbacks keep Express happy
const authenticateToken = auth.authenticateToken;
const requireAdmin =
  typeof auth.requireAdmin === "function"
    ? auth.requireAdmin
    : auth.requireRole(["admin"]);

/**
 * Mounted as: app.use("/admin", router)
 * Routes:
 *   GET  /admin/organizers/pending
 *   POST /admin/organizers/:userId/approve
 *   POST /admin/organizers/:userId/reject
 *   GET  /admin/events/pending
 *   POST /admin/events/:id/publish
 *   POST /admin/events/:id/reject
 */

// --- Organizer approvals ---
router.get(
  "/organizers/pending",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT r.id, r.user_id, u.name, u.email, r.created_at
           FROM organizer_requests r
           JOIN users u ON u.id = r.user_id
          WHERE r.status = 'pending'
          ORDER BY r.created_at ASC`
      );
      return res.json(rows);
    } catch (e) {
      console.error("admin pending organizers error", e);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

router.post(
  "/organizers/:userId/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Invalid user id" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // mark request approved
      await client.query(
        `UPDATE organizer_requests
            SET status = 'approved', reviewed_at = NOW()
          WHERE user_id = $1 AND status = 'pending'`,
        [userId]
      );

      // grant role (or upsert)
      await client.query(
        `INSERT INTO user_org_roles (user_id, role)
         VALUES ($1, 'organizer')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [userId]
      );

      await client.query("COMMIT");
      return res.json({ ok: true });
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      console.error("admin approve organizer error", e);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/organizers/:userId/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Invalid user id" });
    }
    try {
      await pool.query(
        `UPDATE organizer_requests
            SET status = 'rejected', reviewed_at = NOW()
          WHERE user_id = $1 AND status = 'pending'`,
        [userId]
      );
      return res.json({ ok: true });
    } catch (e) {
      console.error("admin reject organizer error", e);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

// --- Event moderation ---
router.get(
  "/events/pending",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, org_id, title, start_at, location, capacity, ticket_type, status
           FROM events
          WHERE status = 'submitted'
          ORDER BY start_at NULLS LAST, id`
      );
      return res.json(rows);
    } catch (e) {
      console.error("admin pending events error", e);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

router.post(
  "/events/:id/publish",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Invalid event id" });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE events
            SET status = 'published', updated_at = NOW()
          WHERE id = $1 AND status = 'submitted'
        RETURNING id, status`,
        [eventId]
      );
      if (!rows.length) {
        const cur = await pool.query(
          `SELECT status FROM events WHERE id = $1`,
          [eventId]
        );
        return res.status(400).json({
          code: "INVALID_STATUS",
          message: "Event must be 'submitted' to publish",
          details: { currentStatus: cur.rows[0]?.status ?? null },
        });
      }
      return res.json({ ok: true, event: rows[0] });
    } catch (e) {
      console.error("admin publish event error", e);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

router.post(
  "/events/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Invalid event id" });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE events
            SET status = 'rejected', updated_at = NOW()
          WHERE id = $1 AND status IN ('submitted','published')
        RETURNING id, status`,
        [eventId]
      );
      if (!rows.length) {
        return res.status(404).json({
          code: "NOT_FOUND",
          message: "Event not found or immutable",
        });
      }
      return res.json({ ok: true, event: rows[0] });
    } catch (e) {
      console.error("admin reject event error", e);
      return res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Server error" });
    }
  }
);

// --- Alias route for frontend: /admin/events/submitted ---
router.get(
  "/events/submitted",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT e.id, e.title, e.description, e.category, e.start_at, e.status, o.name AS organizer
           FROM events e
           LEFT JOIN organizations o ON o.id = e.org_id
          WHERE e.status = 'submitted'
          ORDER BY e.start_at ASC NULLS LAST, e.id ASC`
      );

      const out = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        organizer: r.organizer,
        start_at: r.start_at,
        status: r.status || "submitted",
      }));

      res.json(out);
    } catch (err) {
      console.error("admin list submitted events error", err);
      res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Failed to load submitted events",
      });
    }
  }
);

module.exports = router;
