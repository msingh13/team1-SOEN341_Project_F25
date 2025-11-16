const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const auth = require("../middleware/auth");

const authenticateToken = auth?.authenticateToken || auth;

// helpers
function sign(user) {
  const payload = {
    id: user.id,
    role: user.role || "student",
    approved: !!user.approved,
    email: user.email || null,
    name: user.name || null,
  };
  const secret = process.env.JWT_SECRET || "dev-secret";
  const expiresIn = process.env.JWT_EXPIRES || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

// POST /auth/signup  {name, email, password, student_id?}
router.post("/signup", async (req, res) => {
  const { name, email, password, student_id } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Email and password are required" });
  }
  try {
    const exists = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (exists.rowCount) {
      return res.status(409).json({ code: "CONFLICT", message: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, approved, student_id)
       VALUES ($1,$2,$3,'student', TRUE, $4)
       RETURNING id, name, email, role, approved`,
      [name || null, email, hash, student_id || null]
    );
    const user = rows[0];
    const token = sign(user);
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error("signup error", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

// POST /auth/login  {email, password}
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Email and password are required" });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, role, approved FROM users WHERE email=$1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash || "");
    if (!ok) return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid credentials" });

    const token = sign(u);
    return res.json({ token, user: { id: u.id, name: u.name, email: u.email, role: u.role, approved: u.approved } });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

// POST /auth/request-organizer  {org_name}
router.post("/request-organizer", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { org_name } = req.body || {};
  if (!org_name) return res.status(400).json({ code: "BAD_REQUEST", message: "org_name required" });

  try {
    await pool.query(
      `INSERT INTO organizer_requests (user_id, org_name)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [userId, org_name]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("request-organizer error", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Server error" });
  }
});

module.exports = router;
