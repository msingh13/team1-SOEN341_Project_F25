// src/server/routes/adminOrgs.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

// ---- Simple in-memory store for demo ----
// Persists for the life of the server process.
let orgSeq = 2;
const orgs = [
  { id: 1, name: "Student Union", description: "Campus-wide org", members: [
    { user_id: 1, role: "admin" },   // your admin
    { user_id: 4, role: "organizer" }
  ]},
];

function requireAdmin(req, res, next) {
  const role = req.user?.role;
  if (role !== "admin") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Admin only" });
  }
  next();
}

// GET /admin/orgs
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  res.json(orgs);
});

// GET /admin/orgs/:id
router.get("/:id", authenticateToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const org = orgs.find(o => o.id === id);
  if (!org) return res.status(404).json({ code: "NOT_FOUND", message: "Org not found" });
  res.json(org);
});

// POST /admin/orgs
router.post("/", authenticateToken, requireAdmin, (req, res) => {
  const { name, description } = req.body || {};
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Name is required" });
  }
  const created = { id: ++orgSeq, name: String(name).trim(), description: description || "", members: [] };
  orgs.push(created);
  res.status(201).json(created);
});

// PUT /admin/orgs/:id
router.put("/:id", authenticateToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const org = orgs.find(o => o.id === id);
  if (!org) return res.status(404).json({ code: "NOT_FOUND", message: "Org not found" });
  const { name, description } = req.body || {};
  if (name) org.name = String(name).trim();
  if (description !== undefined) org.description = String(description);
  res.json(org);
});

// DELETE /admin/orgs/:id
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = orgs.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ code: "NOT_FOUND", message: "Org not found" });
  orgs.splice(idx, 1);
  res.json({ ok: true });
});

// POST /admin/orgs/:id/roles   { user_id, role }
router.post("/:id/roles", authenticateToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const org = orgs.find(o => o.id === id);
  if (!org) return res.status(404).json({ code: "NOT_FOUND", message: "Org not found" });

  const { user_id, role } = req.body || {};
  const validRoles = new Set(["member", "organizer", "admin"]);
  if (!Number.isFinite(Number(user_id)) || !validRoles.has(role)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "user_id and valid role are required" });
  }

  const existing = org.members.find(m => m.user_id === Number(user_id));
  if (existing) existing.role = role;
  else org.members.push({ user_id: Number(user_id), role });

  res.json(org);
});

// DELETE /admin/orgs/:id/roles/:userId
router.delete("/:id/roles/:userId", authenticateToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const org = orgs.find(o => o.id === id);
  if (!org) return res.status(404).json({ code: "NOT_FOUND", message: "Org not found" });

  const userId = Number(req.params.userId);
  const idx = org.members.findIndex(m => m.user_id === userId);
  if (idx === -1) return res.status(404).json({ code: "NOT_FOUND", message: "Member not found" });

  // prevent removing the last admin for safety
  const isAdmin = org.members[idx].role === "admin";
  if (isAdmin) {
    const adminCount = org.members.filter(m => m.role === "admin").length;
    if (adminCount <= 1) {
      return res.status(400).json({ code: "LAST_ADMIN", message: "Cannot remove the last admin" });
    }
  }

  org.members.splice(idx, 1);
  res.json(org);
});

module.exports = router;
