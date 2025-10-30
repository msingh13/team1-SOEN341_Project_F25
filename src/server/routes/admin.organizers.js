// src/server/routes/admin.organizers.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

// All routes here require admin (assumes authenticateToken ran earlier if you use JWT)
router.use(requireAdmin);

// internal helper: update status + log (inside a transaction)
async function updateOrganizerStatus(client, { organizerId, action, adminId, reason }) {
  if (!['approve', 'reject'].includes(action)) {
    const e = new Error('Invalid action'); e.status = 400; throw e;
  }
  const nextStatus = action === 'approve' ? 'approved' : 'rejected';
  const stampCol  = action === 'approve' ? 'approved_at' : 'rejected_at';
  const byCol     = action === 'approve' ? 'approved_by' : 'rejected_by';

  // Only allow transition from pending
  const upd = await client.query(
    `
    UPDATE organizations
       SET organizer_status = $2,
           ${stampCol} = now(),
           ${byCol} = $3
     WHERE id = $1
       AND organizer_status = 'pending'
     RETURNING id
    `,
    [organizerId, nextStatus, adminId]
  );

  if (upd.rowCount === 0) {
    const check = await client.query(
      'SELECT id, organizer_status FROM organizations WHERE id = $1',
      [organizerId]
    );
    if (check.rowCount === 0) {
      const e = new Error('Organizer not found'); e.status = 404; throw e;
    } else {
      const e = new Error(`Organizer is not pending (status=${check.rows[0].organizer_status})`);
      e.status = 409; throw e;
    }
  }

  // moderation log (PLURAL table name)
  const actionName = `${action}_organizer`;
  await client.query(
    `
    INSERT INTO moderation_logs (admin_id, target_type, target_id, action, details)
    VALUES ($1, 'organizer', $2, $3, $4::jsonb)
    `,
    [adminId, organizerId, actionName, JSON.stringify(action === 'reject' && reason ? { reason } : {})]
  );

  return { id: upd.rows[0].id, status: nextStatus };
}

// POST /admin/organizers/:id/approve
router.post('/organizers/:id/approve', async (req, res) => {
  const organizerId = Number(req.params.id);
  if (!Number.isFinite(organizerId)) return res.status(400).json({ error: 'Invalid id' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await updateOrganizerStatus(client, {
      organizerId, action: 'approve', adminId: req.admin.id
    });
    await client.query('COMMIT');
    res.json({ ok: true, ...result });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('approve error', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  } finally {
    client.release();
  }
});

// POST /admin/organizers/:id/reject  { reason?: string }
router.post('/organizers/:id/reject', async (req, res) => {
  const organizerId = Number(req.params.id);
  if (!Number.isFinite(organizerId)) return res.status(400).json({ error: 'Invalid id' });

  const reason = (req.body?.reason ?? '').toString().trim().slice(0, 500);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await updateOrganizerStatus(client, {
      organizerId, action: 'reject', adminId: req.admin.id, reason
    });
    await client.query('COMMIT');
    res.json({ ok: true, ...result, ...(reason ? { reason } : {}) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reject error', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  } finally {
    client.release();
  }
});

module.exports = router;
