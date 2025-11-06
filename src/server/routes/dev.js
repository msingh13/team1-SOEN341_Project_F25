// src/server/routes/dev.js
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const router = express.Router();

// PUBLIC dev login – NO auth here
router.post("/login", async (req, res) => {
  try {
    const id = Number(req.body.id);
    const role = (req.body.role || "student").toLowerCase();
    if (!Number.isFinite(id)) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid id" });
    }
    if (!["student", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid role" });
    }

    // Upsert a user so FKs work
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
        [id, `User ${id}`, `user${id}@example.com`, role]
      );
    } catch (e) {
      console.warn("dev/login: user upsert warning:", e.message);
      // don't fail login if seed table shape differs – you just won’t have FK protection
    }

    const token = jwt.sign({ id, role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "4h" });
    return res.json({ token });
  } catch (e) {
    console.error("dev/login failed", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Login failed" });
  }
});

module.exports = router;
