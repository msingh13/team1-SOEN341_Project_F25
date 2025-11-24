// src/server/routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { signToken, authenticateToken, getUserById } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /auth/register
 * Body: { name, email, password, role? }
 * - role defaults to 'student'
 * - password is hashed into password_hash
 * - returns { user, token }
 */
router.post("/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const normalizedRole = role || "student";
  if (!["student", "organizer", "admin"].includes(normalizedRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    // Check existing user by email
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // IMPORTANT: do NOT insert id manually, let SERIAL handle it
    const insertRes = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, approved)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, approved, created_at`,
      [name, email, normalizedRole, passwordHash, normalizedRole !== "student" ? false : true]
    );

    const user = insertRes.rows[0];
    const token = signToken(user);

    return res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /auth/login
 * Body: { email, password }
 * - Verifies password
 * - returns { user, token }
 */
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const userRes = await pool.query(
      `SELECT id, name, email, role, approved, password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userRes.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ message: "No password set for this account" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // strip password_hash from response
    delete user.password_hash;

    const token = signToken(user);
    return res.json({ user, token });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /auth/me
 * - returns the current user (from JWT)
 */
router.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    console.error("auth/me error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
