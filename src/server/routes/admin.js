const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// MOCK storage (dev/demo only)
let nextOrgId = 1;
const orgs = new Map();
const userOrgRoles = [];
let nextUorId = 1;

const VALID_ROLES = new Set(['admin', 'organizer', 'member']);
const now = () => new Date().toISOString();

// Secure: require real admin auth
router.use(authenticateToken, requireAdmin);

const bad = (res, msg, details) => res.status(400).json({ code: 'BAD_REQUEST', message: msg, details });
const withMembers = (org) => ({
  ...org,
  members: userOrgRoles.filter(m => m.org_id === org.id).map(({ user_id, role }) => ({ user_id, role }))
});

router.get('/orgs', (_req, res) => res.json([...orgs.values()].map(withMembers)));

router.get('/orgs/:id', (req, res) => {
  const org = orgs.get(Number(req.params.id));
  if (!org) return res.status(404).json({ code: 'NOT_FOUND', message: 'org not found' });
  res.json(withMembers(org));
});

router.post('/orgs', (req, res) => {
  const { name, description = '' } = req.body || {};
  if (!name || typeof name !== 'string') return bad(res, 'name is required');
  const org = { id: nextOrgId++, name: name.trim(), description: String(description ?? '').trim(), created_at: now(), updated_at: now() };
  orgs.set(org.id, org);
  return res.status(201).json(withMembers(org));
});

router.put('/orgs/:id', (req, res) => {
  const org = orgs.get(Number(req.params.id));
  if (!org) return res.status(404).json({ code: 'NOT_FOUND', message: 'org not found' });
  const { name, description } = req.body || {};
  if (name !== undefined) {
    if (!name || typeof name !== 'string') return bad(res, 'name must be non-empty string');
    org.name = name.trim();
  }
  if (description !== undefined) org.description = String(description ?? '').trim();
  org.updated_at = now();
  res.json(withMembers(org));
});

router.delete('/orgs/:id', (req, res) => {
  const id = Number(req.params.id);
  const existed = orgs.delete(id);
  for (let i = userOrgRoles.length - 1; i >= 0; i--) if (userOrgRoles[i].org_id === id) userOrgRoles.splice(i, 1);
  if (!existed) return res.status(404).json({ code: 'NOT_FOUND', message: 'org not found' });
  res.json({ ok: true });
});

router.post('/orgs/:id/roles', (req, res) => {
  const org = orgs.get(Number(req.params.id));
  if (!org) return res.status(404).json({ code: 'NOT_FOUND', message: 'org not found' });
  const user_id = parseInt(req.body?.user_id, 10);
  const role = req.body?.role;
  if (!Number.isFinite(user_id)) return bad(res, 'user_id (number) required');
  if (!VALID_ROLES.has(role)) return bad(res, 'role must be admin|organizer|member');
  if (userOrgRoles.find(m => m.org_id === org.id && m.user_id === user_id && m.role === role)) {
    return res.status(409).json({ code: 'DUPLICATE', message: 'role already assigned' });
  }
  userOrgRoles.push({ id: nextUorId++, user_id, org_id: org.id, role });
  res.status(201).json(withMembers(org));
});

router.delete('/orgs/:id/roles/:user_id', (req, res) => {
  const org = orgs.get(Number(req.params.id));
  if (!org) return res.status(404).json({ code: 'NOT_FOUND', message: 'org not found' });
  const uid = Number(req.params.user_id);
  let removed = false;
  for (let i = userOrgRoles.length - 1; i >= 0; i--) {
    if (userOrgRoles[i].org_id === org.id && userOrgRoles[i].user_id === uid) {
      userOrgRoles.splice(i, 1);
      removed = true;
    }
  }
  if (!removed) return res.status(404).json({ code: 'NOT_FOUND', message: 'role mapping not found' });
  res.json(withMembers(org));
});

module.exports = router;
