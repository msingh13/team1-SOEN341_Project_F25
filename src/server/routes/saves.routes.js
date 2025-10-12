// src/server/routes/saves.routes.js
const express = require('express');
const router = express.Router();

const { saveEvent, unsaveEvent, listMySaves } = require('../controllers/saves.controller');
const auth = require('../middleware/auth'); // must set req.user = { id, ... }

// All endpoints require auth
router.use(auth);

// Save an event
router.post('/events/:id/save', saveEvent);

// Unsave an event
router.delete('/events/:id/save', unsaveEvent);

// List my saved events
router.get('/me/saves', listMySaves);

module.exports = router;