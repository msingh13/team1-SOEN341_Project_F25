const router = require("express").Router();
const ctrl = require("../controllers/events.controllers");

// GET /events?limit=&page=
router.get("/", ctrl.list);

module.exports = router;
