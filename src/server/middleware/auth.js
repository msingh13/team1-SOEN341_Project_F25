const jwt = require("jsonwebtoken");

function getTokenFrom(req) {
  const h = req.headers?.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return null;
}

function authenticateToken(req, res, next) {
  try {
    const token = getTokenFrom(req);
    if (!token) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing token" });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = {
      id: payload.id,
      role: payload.role,
      approved: !!payload.approved,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch (e) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: `${roles.join("/")} only` });
    }
    next();
  };
}

function requireApproved(req, res, next) {
  if (!req.user?.approved) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Account not approved" });
  }
  next();
}

const requireAdmin = requireRoles("admin");

// Export in both default and named forms so all imports work
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.requireRoles = requireRoles;
module.exports.requireApproved = requireApproved;
module.exports.requireAdmin = requireAdmin;
