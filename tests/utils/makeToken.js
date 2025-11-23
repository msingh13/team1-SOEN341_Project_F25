const jwt = require('jsonwebtoken');

function makeToken(payload = { id: 42 }, opts = {}) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign(payload, secret, { expiresIn: '1h', ...opts });
}

module.exports = { makeToken };
