const { Router } = require("express");
const authenticateToken = require("../middleware/auth");
const { getMyTickets, validateTicket } = require("../controllers/ticketsController");

const router = Router();

router.get("/me/tickets", authenticateToken, getMyTickets);
router.post("/tickets/validate", authenticateToken, validateTicket);

module.exports = router;
