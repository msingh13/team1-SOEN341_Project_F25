// src/server/routes/dev.js
const { Router } = require("express");
const jwt = require("jsonwebtoken");

const router = Router();

router.post("/login", (req, res) => {
  const id = req.body?.id;
  const password = req.body?.password; // (unused here)

  if (!id) return res.status(400).json({ message: "ID is required" });

  const token = jwt.sign({ id }, process.env.JWT_SECRET || "devsecret", { expiresIn: "1h" });
  console.log(`User ${id} logged in, token generated.`);
  res.json({ token });
});

module.exports = router;
