const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

router.use(auth, requireAdmin);

router.get('/admin/analytics', async (_req, res) => {
  const [{ rows: e }, { rows: t }, { rows: ci }] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c FROM events`),
    db.query(`SELECT COUNT(*)::int AS c FROM tickets`),
    db.query(`SELECT COUNT(*)::int AS c FROM tickets WHERE status='checked_in'`),
  ]);
  res.json({
    events: e[0].c,
    ticketsIssued: t[0].c,
    participationRate: t[0].c ? Math.round((ci[0].c / t[0].c) * 100) : 0
  });
});

module.exports = router;
