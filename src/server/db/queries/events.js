const db = require("../index");

// Get all published events
exports.getEvents = async (limit = 20, offset = 0) => {
  const sql = `
    SELECT e.id, e.title, e.start_at, e.location, e.category, o.name as org_name
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    WHERE e.status = 'published'
    ORDER BY e.start_at ASC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await db.query(sql, [limit, offset]);
  return rows;
};

// Get one event by id
exports.getEventById = async (id) => {
  const { rows } = await db.query(
    `SELECT * FROM events WHERE id = $1 AND status='published'`,
    [id]
  );
  return rows[0];
};
