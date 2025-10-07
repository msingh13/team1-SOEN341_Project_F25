// src/server/middleware/auth.js
// Simple dev auth: pass a user id via header "x-user-id: 1"
// In real auth, replace this with your session/JWT check.

module.exports = function auth(req, res, next) {
  const raw = req.header('x-user-id'); // e.g., "1"
  const id = raw ? parseInt(raw, 10) : NaN;

  if (Number.isInteger(id) && id > 0) {
    req.user = { id }; // attach user to request
    return next();
  }

  return res.status(401).json({
    code: 'UNAUTHORIZED',
    message: 'Login required (set x-user-id header during local dev)'
  });
};
