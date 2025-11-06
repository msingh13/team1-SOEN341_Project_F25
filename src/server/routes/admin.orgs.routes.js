const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

router.use(auth, requireAdmin);

// list orgs w/ members
router.get('/admin/orgs', async (_req, res) => {
  const { rows: orgs } = await db.query(`SELECT id, name, description, created_at FROM organizations ORDER BY id DESC`);
  const { rows: members } = await db.query(`SELECT org_id, user_id, role FROM user_org_roles`);
  const byOrg = members.reduce((m, r) => {
    (m[r.org_id] ||= []).push({ user_id: r.user_id, role: r.role });
    return m;
  }, {});
  res.json(orgs.map(o => ({ ...o, members: byOrg[o.id] || [] })));
});

// get one
router.get('/admin/orgs/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await db.query(`SELECT id, name, description FROM organizations WHERE id=$1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const mem = await db.query(`SELECT user_id, role FROM user_org_roles WHERE org_id=$1`, [id]);
  res.json({ ...rows[0], members: mem.rows });
});

// create
router.post('/admin/orgs', async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(`INSERT INTO organizations(name, description) VALUES($1,$2) RETURNING id,name,description,created_at`, [name, description ?? null]);
  res.status(201).json(rows[0]);
});

// update
router.put('/admin/orgs/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, description } = req.body || {};
  const { rows } = await db.query(
    `UPDATE organizations SET name = COALESCE($1,name), description = COALESCE($2,description), updated_at = NOW()
     WHERE id=$3 RETURNING id,name,description,updated_at`,
    [name ?? null, description ?? null, id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const mem = await db.query(`SELECT user_id, role FROM user_org_roles WHERE org_id=$1`, [id]);
  res.json({ ...rows[0], members: mem.rows });
});

// delete
router.delete('/admin/orgs/:id', async (req, res) => {
  const id = Number(req.params.id);
  await db.query(`DELETE FROM organizations WHERE id=$1`, [id]);
  res.json({ ok: true });
});

// assign role
router.post('/admin/orgs/:id/roles', async (req, res) => {
  const id = Number(req.params.id);
  const { user_id, role } = req.body || {};
  if (!user_id || !role) return res.status(400).json({ error: 'user_id & role required' });
  await db.query(
    `INSERT INTO user_org_roles(user_id, org_id, role) VALUES($1,$2,$3)
     ON CONFLICT (user_id, org_id, role) DO NOTHING`,
    [user_id, id, role]
  );
  const org = await db.query(`SELECT id, name, description FROM organizations WHERE id=$1`, [id]);
  const mem = await db.query(`SELECT user_id, role FROM user_org_roles WHERE org_id=$1`, [id]);
  res.json({ ...org.rows[0], members: mem.rows });
});

// remove role (any role for that user in org)
router.delete('/admin/orgs/:id/roles/:userId', async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.params.userId);
  // Optional safety: keep at least one admin
  const { rows: admins } = await db.query(`SELECT COUNT(*)::int AS c FROM user_org_roles WHERE org_id=$1 AND role='admin'`, [id]);
  const { rows: isAdmin } = await db.query(`SELECT 1 FROM user_org_roles WHERE org_id=$1 AND user_id=$2 AND role='admin'`, [id, userId]);
  if (admins[0].c <= 1 && isAdmin.length) {
    return res.status(400).json({ message: 'Cannot remove last admin from organization' });
  }
  await db.query(`DELETE FROM user_org_roles WHERE org_id=$1 AND user_id=$2`, [id, userId]);
  const org = await db.query(`SELECT id, name, description FROM organizations WHERE id=$1`, [id]);
  const mem = await db.query(`SELECT user_id, role FROM user_org_roles WHERE org_id=$1`, [id]);
  res.json({ ...org.rows[0], members: mem.rows });
});

module.exports = router;
