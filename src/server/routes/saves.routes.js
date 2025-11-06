// src/server/routes/saves.routes.js
const express = require('express');
const router = express.Router();

const { saveEvent, unsaveEvent, listMySaves } = require('../controllers/saves.controller');
const auth = require('../middleware/auth');

// Attach auth PER route (so only these need a token)
router.post('/events/:id/save', auth, saveEvent);
router.delete('/events/:id/save', auth, unsaveEvent);
router.get('/me/saves', auth, listMySaves);

module.exports = router;
