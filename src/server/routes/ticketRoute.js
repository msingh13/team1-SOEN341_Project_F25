import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getMyTickets } from "../controllers/ticketsController.js";

const router = Router();

router.get("/me/tickets", authenticateToken, getMyTickets);

export default router;