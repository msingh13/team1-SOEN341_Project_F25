// src/server/routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // must export { query }

// ---- helpers ----
function buildWhere({ q, categories, org, dateFrom, dateTo }) {
  const where = [`e.status = 'published'`]; // <- status model
  const params = [];
  let i = 1;

  if (q) {
    where.push(`(e.title ILIKE $${i} OR e.description ILIKE $${i})`);
    params.push(`%${q}%`); i++;
  }
  if (Array.isArray(categories) && categories.length) {
    where.push(`e.category = ANY($${i})`);
    params.push(categories); i++;
  }
  if (org) {
    where.push(`e.org_id = $${i}`);
    params.push(org); i++;
  }
  if (dateFrom) {
    where.push(`e.start_time::date >= $${i}::date`);
    params.push(dateFrom); i++;
  }
  if (dateTo) {
    where.push(`e.start_time::date <= $${i}::date`);
    params.push(dateTo); i++;
  }

  return { whereSql: `WHERE ${where.join(' AND ')}`, params };
}

function resolveSort(sort) {
  switch (sort) {
    case 'start_desc':   return 'e.start_time DESC';
    case 'created_desc': return 'e.created_at DESC';
    case 'start_asc':
    default:             return 'e.start_time ASC';
  }
}

// ---- GET /events ----
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.perPage || '12', 10)));
    const offset = (page - 1) * perPage;

    const q = (req.query.q || '').trim() || null;
    const categories = req.query.category
      ? String(req.query.category).split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const org = req.query.org ? Number(req.query.org) : null;
    if (req.query.org && !Number.isFinite(org)) {
      return res.status(400).json({ error: 'org must be a number' });
    }
    const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : null;
    const dateTo   = req.query.dateTo   ? String(req.query.dateTo)   : null;

    const sort = new Set(['start_asc','start_desc','created_desc']).has(req.query.sort)
      ? req.query.sort : 'start_asc';
    const orderBy = resolveSort(sort);

    const { whereSql, params } = buildWhere({ q, categories, org, dateFrom, dateTo });

    // count
    const countSql = `
      SELECT COUNT(*)::int AS c
      FROM events e
      ${whereSql}
    `;
    const { rows: countRows } = await db.query(countSql, params);
    const total = countRows[0]?.c || 0;

    // data (compute tickets_claimed lazily)
    const dataSql = `
      SELECT
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.capacity,
        COALESCE((
          SELECT COUNT(*) FROM tickets t
          WHERE t.event_id = e.id AND t.status = 'claimed'
        ), 0) AS tickets_claimed,
        (e.capacity - COALESCE((
          SELECT COUNT(*) FROM tickets t
          WHERE t.event_id = e.id AND t.status = 'claimed'
        ), 0)) AS remaining_seats,
        e.location, e.category, e.org_id,
        o.name AS organizer
      FROM events e
      LEFT JOIN organizations o ON o.id = e.org_id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataParams = [...params, perPage, offset];
    const { rows } = await db.query(dataSql, dataParams);

    return res.json({
      data: rows,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (err) {
    console.error('❌ Error listing events:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- GET /events/:id ----
router.get('/:id', async (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

  try {
    const sql = `
      SELECT
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.capacity, e.status,
        COALESCE((
          SELECT COUNT(*) FROM tickets t
          WHERE t.event_id = e.id AND t.status = 'claimed'
        ), 0) AS tickets_claimed,
        (e.capacity - COALESCE((
          SELECT COUNT(*) FROM tickets t
          WHERE t.event_id = e.id AND t.status = 'claimed'
        ), 0)) AS remaining_seats,
        e.location, e.category, e.org_id,
        o.name AS organizer
      FROM events e
      LEFT JOIN organizations o ON o.id = e.org_id
      WHERE e.id = $1
      LIMIT 1
    `;
    const { rows } = await db.query(sql, [eventId]);
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });

    const ev = rows[0];
    if (ev.status !== 'published') {
      return res.status(403).json({ error: 'Event is not published' });
    }
    return res.json(ev);
  } catch (err) {
    console.error('🔥 Error fetching event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
