const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const id = Number(req.body.id);
    const role = (req.body.role || "student");
    if (!Number.isFinite(id)) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid id" });
    }

    // Upsert user so FKs (saves/tickets) won’t fail
    await pool.query(
      `INSERT INTO users (id, name, email, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
      [id, `User ${id}`, `user${id}@example.com`, role]
    );

    const token = jwt.sign({ id, role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "4h" });
    res.json({ token });
  } catch (e) {
    console.error("dev/login failed", e);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Login failed" });
  }
});

module.exports = router;
