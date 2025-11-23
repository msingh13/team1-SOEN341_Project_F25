// src/server/routes/ticketRoute.js
const express = require("express");
const router = express.Router();

// ✅ Load middleware defensively: support both default and named export
const authModule = require("../middleware/auth");
const authenticateToken = authModule.authenticateToken || authModule;

const { getMyTickets, validateTicket } = require("../controllers/ticketsController");

// GET /me/tickets  (student/org/admin)
router.get("/me/tickets", authenticateToken, getMyTickets);

// POST /tickets/validate  (organizer/admin)
router.post("/tickets/validate", authenticateToken, validateTicket);

module.exports = router;
