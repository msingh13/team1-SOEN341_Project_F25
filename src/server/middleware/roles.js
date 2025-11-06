// src/server/middleware/roles.js
module.exports.ensureRole = (...allowed) => {
    return (req, res, next) => {
      // requires authenticateToken to have already set req.user
      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing token" });
      }
      if (!allowed.includes(role)) {
        return res.status(403).json({ code: "FORBIDDEN", message: `${allowed.join("/")} only` });
      }
      next();
    };
  };
  