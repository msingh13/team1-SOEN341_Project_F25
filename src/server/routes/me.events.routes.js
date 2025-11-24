const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// GET /me/events  — organizer/admin sees their org's events
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  // find orgs where user is organizer/admin
  const { rows: orgs } = await db.query(
    `SELECT DISTINCT org_id FROM user_org_roles WHERE user_id=$1 AND role IN ('organizer','admin')`,
    [userId]
  );
  if (orgs.length === 0) return res.json({ data: [], totalPages: 1 });

  const orgIds = orgs.map(o => o.org_id);
  const { rows: events } = await db.query(
    `SELECT id, title, start_at AS "startAt", location, capacity,
            (capacity - COALESCE(issued.cnt,0)) AS remaining,
            status
       FROM events e
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS cnt
           FROM tickets
          WHERE status IN ('claimed','checked_in')
          GROUP BY event_id
       ) issued ON issued.event_id = e.id
      WHERE e.org_id = ANY($1::int[])
      ORDER BY e.start_at ASC`,
    [orgIds]
  );

  res.json({ data: events, totalPages: 1 });
});

module.exports = router;
