// server/db/queries/events.js
const db = require("../index");

// -------------------------
// Helpers
// -------------------------

function buildWhere({ q, categories, org, dateFrom, dateTo } = {}) {
  const where = [`e.status = 'published'`];
  const params = [];
  let i = 1;

  // Full-text-ish search on title / description / location
  if (q) {
    params.push(`%${q}%`);
    where.push(
      `(COALESCE(e.title,'') ILIKE $${i}
        OR COALESCE(e.description,'') ILIKE $${i}
        OR COALESCE(e.location,'') ILIKE $${i})`
    );
    i++;
  }

  // Categories: array of strings
  if (Array.isArray(categories) && categories.length > 0) {
    params.push(categories);
    where.push(`e.category = ANY($${i})`);
    i++;
  }

  // Filter by org_id (numeric)
  if (org) {
    params.push(org);
    where.push(`e.org_id = $${i}`);
    i++;
  }

  // Date range (by start_at::date)
  if (dateFrom) {
    params.push(dateFrom);
    where.push(`e.start_at::date >= $${i}::date`);
    i++;
  }

  if (dateTo) {
    params.push(dateTo);
    where.push(`e.start_at::date <= $${i}::date`);
    i++;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

function resolveSort(sort) {
  switch (sort) {
    case "start_desc":
      return "e.start_at DESC NULLS LAST, e.id DESC";
    case "created_desc":
      return "e.created_at DESC NULLS LAST, e.id DESC";
    case "start_asc":
    default:
      return "e.start_at ASC NULLS FIRST, e.id ASC";
  }
}

// -------------------------
// Public API
// -------------------------

/**
 * Get paginated, sorted events (published only), applying optional filters.
 *
 * @param {{
 *   q?: string,
 *   categories?: string[],
 *   org?: number | null,
 *   dateFrom?: string | null,
 *   dateTo?: string | null,
 *   sort?: 'start_asc'|'start_desc'|'created_desc',
 *   limit?: number,
 *   offset?: number
 * }} args
 */
exports.getEvents = async ({
  q = null,
  categories = [],
  org = null,
  dateFrom = null,
  dateTo = null,
  sort = "start_asc",
  limit = 20,
  offset = 0,
} = {}) => {
  const { whereSql, params } = buildWhere({
    q,
    categories,
    org,
    dateFrom,
    dateTo,
  });

  const orderBy = resolveSort(sort);

  const sql = `
    SELECT
      e.id,
      e.title,
      e.description,
      e.start_at,
      e.end_at,
      e.capacity,
      e.location,
      e.category,
      e.org_id,
      o.name AS organizer,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM tickets t
          WHERE t.event_id = e.id
            AND t.status IN ('claimed','checked_in')
        ),
        0
      )::int AS tickets_issued,
      GREATEST(
        e.capacity - COALESCE(
          (
            SELECT COUNT(*)
            FROM tickets t
            WHERE t.event_id = e.id
              AND t.status IN ('claimed','checked_in')
          ),
          0
        ),
        0
      )::int AS remaining_seats
    FROM events e
    LEFT JOIN organizations o ON o.id = e.org_id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const values = [...params, limit, offset];
  const { rows } = await db.query(sql, values);
  return rows;
};

/**
 * Count total published events for the given filters (for pagination).
 *
 * @param {{
 *   q?: string,
 *   categories?: string[],
 *   org?: number | null,
 *   dateFrom?: string | null,
 *   dateTo?: string | null
 * }} args
 */
exports.countPublished = async ({
  q = null,
  categories = [],
  org = null,
  dateFrom = null,
  dateTo = null,
} = {}) => {
  const { whereSql, params } = buildWhere({
    q,
    categories,
    org,
    dateFrom,
    dateTo,
  });

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM events e
    ${whereSql}
  `;

  const { rows } = await db.query(sql, params);
  return Number(rows[0]?.total || 0);
};
