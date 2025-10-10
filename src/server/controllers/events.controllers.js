const Events = require('../db/queries/events');

const bad = (res, msg, details) =>
  res.status(400).json({ code: 'BAD_REQUEST', message: msg, details });

exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(20, Math.max(1, parseInt(req.query.perPage || '12', 10)));
    const offset = (page - 1) * perPage;

    // filters
    const q = (req.query.q || '').trim() || null;

    const categories = req.query.category
      ? String(req.query.category).split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const org = req.query.org ? Number(req.query.org) : null;
    if (req.query.org && !Number.isFinite(org)) return bad(res, 'org must be a number');

    const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : null;
    const dateTo   = req.query.dateTo   ? String(req.query.dateTo)   : null;

    const allowedSort = new Set(['start_asc', 'start_desc', 'created_desc']);
    const sort = allowedSort.has(req.query.sort) ? req.query.sort : 'start_asc';

    // query DB
    const [data, total] = await Promise.all([
      Events.getEvents({ q, categories, org, dateFrom, dateTo, sort, limit: perPage, offset }),
      Events.countPublished({ q, categories, org, dateFrom, dateTo }),
    ]);

    const totalPages = Math.max(Math.ceil(total / perPage), 1);
    return res.json({ data, page, perPage, total, totalPages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to list events', details: e.message });
  }
};
