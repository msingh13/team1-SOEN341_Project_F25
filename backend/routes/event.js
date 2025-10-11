console.log("✅ event.js loaded successfully");

const express = require('express');
const router = express.Router();

// GET /events/:id — get detailed info for one event
router.get('/:id', async (req, res) => {
  const pool = req.app.get('pool'); // ✅ récupère le pool depuis index.js
  const eventId = req.params.id;

  try {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.category,
        e.date_time,
        e.location,
        e.ticket_type,
        e.remaining_seats
      FROM events e
      WHERE e.id = $1;
    `;

    const result = await pool.query(query, [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result.rows[0]);
 } catch (err) {
  console.error("❌ Detailed DB error:", err.message);
  res.status(500).json({ error: err.message });
}

});

module.exports = router;
e: console.log("✅ event.js loaded successfully");

