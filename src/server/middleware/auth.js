// src/server/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function authenticateToken(req, res, next) {
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);

  // Bearer JWT path
  if (m) {
    try {
      const payload = jwt.verify(m[1], process.env.JWT_SECRET || "devsecret");
      const idNum = Number(payload.id);
      if (!Number.isFinite(idNum)) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token payload" });
      }
      req.user = { id: idNum, role: payload.role || "student" };
      return next();
    } catch (e) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
    }
  }

// Dev fallback: X-User-Id header
  const devId = req.headers["x-user-id"];
  if (devId && Number.isFinite(Number(devId))) {
    req.user = { id: Number(devId) };
    return next();
   }


  return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing token" });
};
