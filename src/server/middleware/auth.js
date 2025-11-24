// src/server/middleware/auth.js
const jwt = require("jsonwebtoken");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

/**
 * Sign a JWT for the given user row.
 * Expects: { id, role, approved }
 */
function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      approved: user.approved,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Read Bearer token, verify, and attach req.user = { id, role, approved }
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!token) {
    return res
      .status(401)
      .json({ code: "UNAUTHENTICATED", message: "Missing auth token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: payload.userId,
      role: payload.role,
      approved: payload.approved,
    };

    return next();
  } catch (err) {
    console.error("JWT verify failed", err);
    return res
      .status(401)
      .json({ code: "UNAUTHENTICATED", message: "Invalid or expired token" });
  }
}

/**
 * Middleware factory: require that user has one of the given roles.
 * Usage: router.get("/admin/stats", authenticateToken, requireRoles("admin"), ...)
 *        router.post("/x", authenticateToken, requireRoles(["student","organizer"]), ...)
 */
function requireRoles(roles) {
  const list = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ code: "UNAUTHENTICATED", message: "Sign in required" });
    }

    if (!list.includes(req.user.role)) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Backwards-compatible single-role helper.
 * If any route still calls requireRole("admin"), it will work.
 */
function requireRole(role) {
  return requireRoles(role);
}

/**
 * Simple admin-only middleware (used in some older routes).
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ code: "UNAUTHENTICATED", message: "Sign in required" });
  }
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ code: "FORBIDDEN", message: "Admin only" });
  }
  next();
}

/**
 * Ensure the account is approved (for saves, tickets, etc.)
 */
function requireApproved(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ code: "UNAUTHENTICATED", message: "Sign in required" });
  }
  if (!req.user.approved) {
    return res.status(403).json({
      code: "NOT_APPROVED",
      message: "Your account has not been approved yet.",
    });
  }
  next();
}

/**
 * Helper used by /auth/me and anywhere else that needs full user row.
 */
async function getUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, approved, created_at
       FROM users
      WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  signToken,
  authenticateToken,
  requireRoles,
  requireRole,
  requireAdmin,
  requireApproved,
  getUserById,
};
