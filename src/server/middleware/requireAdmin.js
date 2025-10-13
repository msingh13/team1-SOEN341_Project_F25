const db = require('../db');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const userId = req.headers['x-user-id']; // FE/backoffice should send this
    if (!userId) return res.status(401).json({ error: 'Unauthorized: missing user' });

    // Look up user role
    const { rows } = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );
    const me = rows[0];
    if (!me) return res.status(401).json({ error: 'Unauthorized: user not found' });
    if (me.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' });

    // attach for later use
    req.admin = { id: me.id };
    next();
  } catch (err) {
    console.error('requireAdmin error', err);
    res.status(500).json({ error: 'Internal error' });
  }
};
