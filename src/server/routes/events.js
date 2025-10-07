const router = require("express").Router();
const ctrl = require("../controllers/events.controller");

// GET /events?limit=&page=
router.get("/", ctrl.list);

// POST /events/:id/tickets -> claim a ticket for the current user
router.post("/:id/tickets", ctrl.claimTicket);

// --- new endpoints for saves ---
router.post("/:id/save", ctrl.saveEvent);         // save an event
router.delete("/:id/save", ctrl.unsaveEvent);     // unsave an event
router.get("/users/:id/saves", ctrl.listUserSaves); // list all saved events for a user

module.exports = router;
