// src/server/routes/admin.orgs.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ Defensive import: supports both default and named exports
const auth = require("../middleware/auth");
const authenticateToken = auth.authenticateToken || auth;
const requireRoles = auth.requireRoles ? auth.requireRoles : (() => (_req, _res, next) => next());

/* ---------------- Orgs CRUD ---------------- */

router.get("/admin/orgs", authenticateToken, requireRoles("admin"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, description, created_at
       FROM organizations
      ORDER BY id`
  );
  res.json(rows);
});

router.post("/admin/orgs", authenticateToken, requireRoles("admin"), async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ code: "BAD_REQUEST", message: "Missing name" });

  const { rows } = await pool.query(
    `INSERT INTO organizations (name, description)
     VALUES ($1,$2)
     RETURNING id, name, description`,
    [name, description || null]
  );
  res.status(201).json(rows[0]);
});

router.put("/admin/orgs/:id", authenticateToken, requireRoles("admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid id" });

  const { name, description } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE organizations
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            updated_at = NOW()
      WHERE id = $1
    RETURNING id, name, description`,
    [id, name ?? null, description ?? null]
  );
  if (!rows.length) return res.status(404).json({ code: "NOT_FOUND", message: "Org not found" });
  res.json(rows[0]);
});

router.delete("/admin/orgs/:id", authenticateToken, requireRoles("admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid id" });

  await pool.query(`DELETE FROM organizations WHERE id = $1`, [id]);
  res.json({ ok: true });
});

/* --------- Assign/Remove roles in org --------- */

router.post("/admin/orgs/:id/roles", authenticateToken, requireRoles("admin"), async (req, res) => {
  const orgId = Number(req.params.id);
  const { user_id, role } = req.body || {};
  if (!Number.isFinite(orgId) || !user_id || !role) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Missing/invalid org_id or user_id/role" });
  }

  await pool.query(
    `INSERT INTO user_org_roles (org_id, user_id, role)
     VALUES ($1,$2,$3)
     ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [orgId, Number(user_id), role]
  );
  res.json({ ok: true });
});

router.delete("/admin/orgs/:id/roles/:userId", authenticateToken, requireRoles("admin"), async (req, res) => {
  const orgId = Number(req.params.id);
  const userId = Number(req.params.userId);
  if (!Number.isFinite(orgId) || !Number.isFinite(userId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid id(s)" });
  }

  await pool.query(
    `DELETE FROM user_org_roles WHERE org_id = $1 AND user_id = $2`,
    [orgId, userId]
  );
  res.json({ ok: true });
});

/* ------------- Organizer approvals ------------- */

router.get("/admin/organizers/requests", authenticateToken, requireRoles("admin"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.user_id, u.name, u.email, r.org_name, r.status, r.created_at
       FROM organizer_requests r
       JOIN users u ON u.id = r.user_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at`
  );
  res.json(rows);
});

router.post("/admin/organizers/:requestId/approve", authenticateToken, requireRoles("admin"), async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid request id" });
  }

  // 1) mark request approved
  const r = await pool.query(
    `UPDATE organizer_requests
        SET status='approved', decided_at=NOW()
      WHERE id=$1
    RETURNING user_id, org_name`,
    [requestId]
  );
  if (!r.rowCount) return res.status(404).json({ code: "NOT_FOUND", message: "Request not found" });
  const { user_id, org_name } = r.rows[0];

  // 2) ensure org exists (or create)
  const org = await pool.query(
    `INSERT INTO organizations (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [org_name]
  );
  const orgId = org.rows[0].id;

  // 3) elevate user + approve
  await pool.query(
    `UPDATE users SET role='organizer', approved=TRUE, updated_at=NOW() WHERE id=$1`,
    [user_id]
  );

  // 4) grant role in that org
  await pool.query(
    `INSERT INTO user_org_roles (org_id, user_id, role)
     VALUES ($1,$2,'organizer')
     ON CONFLICT (org_id, user_id) DO UPDATE SET role='organizer'`,
    [orgId, user_id]
  );

  res.json({ ok: true, org_id: orgId });
});

router.post("/admin/organizers/:requestId/reject", authenticateToken, requireRoles("admin"), async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid request id" });
  }

  const r = await pool.query(
    `UPDATE organizer_requests
        SET status='rejected', decided_at=NOW()
      WHERE id=$1`,
    [requestId]
  );
  if (!r.rowCount) return res.status(404).json({ code: "NOT_FOUND", message: "Request not found" });
  res.json({ ok: true });
});

module.exports = router;
