// Purpose: define admin-only routes for moderating events

console.log("✅ Admin routes loaded");

const express = require("express");
const router = express.Router();

// import controller functions
const moderation = require("../controllers/moderation.controller");

// POST /admin/events/:id/publish
router.post("/events/:id/publish", moderation.publishEvent);

// POST /admin/events/:id/reject
router.post("/events/:id/reject", moderation.rejectEvent);

module.exports = router;