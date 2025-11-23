// src/server/middleware/requireAdmin.js
const db = require('../db');

module.exports = async function requireAdmin(req, res, next) {
  try {
    // Prefer role from JWT (set by auth middleware)
    const user = req.user;
    if (!user || !Number.isFinite(Number(user.id))) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Login required' });
    }

    const role = (user.role || '').toString().toLowerCase();
    if (role) {
      if (role !== 'admin') {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin only' });
      }
      return next();
    }

    // Fallback: query DB when token had no role
    const { rows } = await db.query('SELECT id, role FROM users WHERE id = $1', [user.id]);
    const me = rows[0];
    if (!me) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
    }
    if (String(me.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin only' });
    }

    return next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal error' });
  }
};
