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

    // Upsert a user so FKs work. Provide a dummy password_hash to satisfy NOT NULL.
    // On conflict, don't touch password_hash; just ensure role/approved are correct.
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash, approved)
       VALUES ($1, $2, $3, $4, '', TRUE)
       ON CONFLICT (id) DO UPDATE
         SET role = EXCLUDED.role,
             approved = TRUE`,
      [id, `User ${id}`, `user${id}@example.com`, role]
    );

    const secret = process.env.JWT_SECRET || "devsecret";
    const token = jwt.sign(
      {
        id,
        role,
        approved: true, // ensure student actions (save/claim) are allowed
        email: `user${id}@example.com`,
        name: `User ${id}`,
      },
      secret,
      { expiresIn: "4h" }
    );
    return res.json({ token });
  } catch (e) {
    console.error("dev/login failed", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Login failed" });
  }
});

module.exports = router;
