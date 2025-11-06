const db = require('../db');

module.exports = async function requireAdmin(req, res, next) {
  try {
    // Prefer authenticated user from JWT, fallback to header for dev/backoffice
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId)
      return res.status(401).json({ error: 'Unauthorized: missing user' });

    const { rows } = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );
    const me = rows[0];

    if (!me)
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    if (String(me.role).toLowerCase() !== 'admin')
      return res.status(403).json({ error: 'Forbidden: admin only' });

    req.admin = { id: me.id };
    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
};
