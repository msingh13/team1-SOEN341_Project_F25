const Events = require('../db/queries/events');

const bad = (res, msg, details) =>
  res.status(400).json({ code: 'BAD_REQUEST', message: msg, details });

// --- small helpers ---
function parsePositiveInt(v, def) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function isIsoDateString(s) {
  return typeof s === "string" && !Number.isNaN(Date.parse(s));
}
function toDate(s) {
  return new Date(s);
}
function badRequest(message, details) {
  return { code: "BAD_REQUEST", message, details };
}

/**
 * Parse & validate req.query, returning { ok, errors, page, limit, offset, filters }
 */
function parseQuery(q) {
  const page = parsePositiveInt(q.page ?? "1", 1);
  let limit = parsePositiveInt(q.limit ?? "20", 20);
  if (limit > 50) limit = 50;
  const offset = (page - 1) * limit;

  const { category, org, from, to, q: search } = q;

  const errors = [];
  if (!Number.isInteger(page) || page < 1) errors.push({ field: "page", message: "Must be a positive integer" });
  if (!Number.isInteger(limit) || limit < 1) errors.push({ field: "limit", message: "Must be a positive integer" });
  if (from && !isIsoDateString(from)) errors.push({ field: "from", message: "Invalid ISO date string" });
  if (to && !isIsoDateString(to)) errors.push({ field: "to", message: "Invalid ISO date string" });
  if (from && to && isIsoDateString(from) && isIsoDateString(to) && toDate(from) > toDate(to)) {
    errors.push({ field: "range", message: "`from` must be <= `to`" });
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    page,
    limit,
    offset,
    filters: {
      category: category || null,
      org: org || null,
      from: from || null, // keep as string; DB layer will cast to timestamptz
      to: to || null,
      q: search || null
    }
  };
}

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
  const parsed = parseQuery(req.query);
  if (!parsed.ok) {
    return res.status(400).json(badRequest("Invalid query params", parsed.errors));
  }

  const { page, limit, offset, filters } = parsed;

  try {
    const [data, total] = await Promise.all([
      Events.getEvents({ limit, offset, filters }),
      Events.countPublished({ filters })
    ]);

    // shape already matches the contract
    res.json({ data, page, limit, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to list events', details: e.message });
  }
};

