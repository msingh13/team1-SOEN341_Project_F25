// src/server/routes/admin.routes.js
// Purpose: define admin-only routes for moderating events

console.log("✅ Admin routes loaded");

const express = require("express");
const router = express.Router();

// Middleware: JWT authentication + admin role check
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

// Controllers
const moderation = require("../controllers/moderation.controller");

// Protect all admin endpoints
router.use(authenticateToken, requireAdmin);

// POST /admin/events/:id/publish → publish a submitted event
router.post("/events/:id/publish", moderation.publishEvent);

// POST /admin/events/:id/reject → reject a submitted event
router.post("/events/:id/reject", moderation.rejectEvent);

module.exports = router;
