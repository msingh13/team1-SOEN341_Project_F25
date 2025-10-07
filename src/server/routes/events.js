const router = require("express").Router();
const ctrl = require("../controllers/events.controller");
const { claimTicket } = require('../controllers/events.controller');

// GET /events?limit=&page=
router.get("/", ctrl.list);

// POST /events/:id/tickets -> claim a ticket for the current user
router.post("/:id/tickets", ctrl.claimTicket);

module.exports = router;
