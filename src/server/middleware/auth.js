// src/server/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function authenticateToken(req, res, next) {
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);

  if (m) {
    try {
      const payload = jwt.verify(m[1], process.env.JWT_SECRET || "devsecret");
      const id = Number(payload.id);
      if (!Number.isFinite(id)) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token payload" });
      }
      req.user = { id, role: payload.role || "student" };
      return next();
    } catch {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
    }
  }

  // DEV fallback: X-User-Id (optional X-User-Role)
  const devId = req.headers["x-user-id"];
  if (devId && Number.isFinite(Number(devId))) {
    req.user = { id: Number(devId), role: (req.headers["x-user-role"] || "student") };
    return next();
  }

  return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing token" });
};
