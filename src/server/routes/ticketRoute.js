// src/server/routes/ticketRoute.js
const { Router } = require("express");
const authenticateToken = require("../middleware/auth"); // your CJS middleware
const { getMyTickets, validateTicket } = require("../controllers/ticketsController"); // convert controller to CJS too

const router = Router();
router.get("/me/tickets", authenticateToken, getMyTickets);
router.post('/tickets/validate', authenticateToken, validateTicket);



module.exports = router;
