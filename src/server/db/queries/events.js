const db = require("../index");

// list of published events
exports.getEvents = async (limit = 20, offset = 0) => {
  const sql = `
    SELECT e.id, e.title, e.start_at, e.location, e.category, o.name AS org_name
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    WHERE e.status = 'published'
    ORDER BY e.start_at ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await db.query(sql, [limit, offset]);
  return rows;
};

exports.countPublished = async () => {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS c FROM events WHERE status='published'`
  );
  return rows[0].c;
};
