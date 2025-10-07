const { pool } = require('../index');

exports.saveEvent = async (userId, eventId) => {
  const sql = `
    INSERT INTO saves (user_id, event_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, event_id) DO NOTHING
    RETURNING user_id, event_id, created_at`;
  const { rows } = await pool.query(sql, [userId, eventId]);
  return rows[0] || null; // null → already saved before
};

exports.unsaveEvent = async (userId, eventId) => {
  const { rowCount } = await pool.query(
    `DELETE FROM saves WHERE user_id = $1 AND event_id = $2`,
    [userId, eventId]
  );
  return rowCount > 0;
};

exports.listSavedEventsForUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT e.*
       FROM saves s
       JOIN events e ON e.id = s.event_id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows;
};
