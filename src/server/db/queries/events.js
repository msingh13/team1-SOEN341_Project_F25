// server/db/queries/events.js
const db = require("../index");

// Build WHERE clause and parameter list for published events + optional filters
function buildWhere(filters = {}) {
  const where = [`e.status = 'published'`];
  const params = [];

  if (filters.category) {
    params.push(filters.category);
    where.push(`LOWER(e.category) = LOWER($${params.length})`);
  }

  if (filters.org) {
    params.push(filters.org);
    where.push(`LOWER(o.name) = LOWER($${params.length})`);
  }

  if (filters.from) {
    params.push(filters.from);
    where.push(`e.start_at >= $${params.length}::timestamptz`);
  }

  if (filters.to) {
    params.push(filters.to);
    where.push(`e.start_at <= $${params.length}::timestamptz`);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    const p = `$${params.length}`;
    // search across title, location, category, organization name
    where.push(
      `(COALESCE(e.title,'') ILIKE ${p}
        OR COALESCE(e.location,'') ILIKE ${p}
        OR COALESCE(e.category,'') ILIKE ${p}
        OR COALESCE(o.name,'') ILIKE ${p})`
    );
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params
  };
}

/**
 * Get paginated, sorted events (published only), applying optional filters.
 * @param {{limit:number, offset:number, filters?:{category?:string, org?:string, from?:string, to?:string, q?:string}}} args
 */
exports.getEvents = async ({ limit = 20, offset = 0, filters = {} }) => {
  const { whereSql, params } = buildWhere(filters);

  const sql = `
    SELECT
      e.id,
      e.title,
      e.start_at,
      e.location,
      e.category,
      o.name AS org_name
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    ${whereSql}
    ORDER BY e.start_at ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const values = [...params, limit, offset];
  const { rows } = await db.query(sql, values);
  return rows;
};

/**
 * Count total published events for the same filter set (for pagination).
 * @param {{filters?:{category?:string, org?:string, from?:string, to?:string, q?:string}}} args
 */
exports.countPublished = async ({ filters = {} }) => {
  const { whereSql, params } = buildWhere(filters);

  const sql = `
    SELECT COUNT(*)::int AS count
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    ${whereSql}
  `;

  const { rows } = await db.query(sql, params);
  return rows[0]?.count ?? 0;
};
