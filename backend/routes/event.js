// backend/routes/event.js
import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;
const router = express.Router();

console.log("✅ event.js loaded successfully");

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

console.log("✅ PostgreSQL pool created successfully");

// ==============================
// ✅ GET all published events
// ==============================
router.get("/events", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, start_time, end_time, capacity, tickets_claimed, 
      (capacity - tickets_claimed) AS remaining_seats 
      FROM campus_events 
      WHERE is_published = TRUE
      ORDER BY start_time ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==============================
// ✅ GET event details by ID
// ==============================
router.get("/events/:id", async (req, res) => {
  const eventId = req.params.id;
  console.log(`📩 Request received for /events/${eventId}`);

  // Validate event ID
  if (isNaN(eventId)) {
    console.log("❌ Invalid event ID format");
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    // Fetch event
    const result = await pool.query(
      `SELECT id, title, description, start_time, end_time, capacity, tickets_claimed, is_published 
       FROM campus_events 
       WHERE id = $1`,
      [eventId]
    );

    if (result.rows.length === 0) {
      console.log("⚠️ No event found with that ID");
      return res.status(404).json({ error: "Event not found" });
    }

    const event = result.rows[0];

    if (!event.is_published) {
      console.log("🚫 Event is not published");
      return res.status(403).json({ error: "Event is not published" });
    }

    const remainingSeats = event.capacity - event.tickets_claimed;

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      capacity: event.capacity,
      remaining_seats: remainingSeats,
    });
  } catch (error) {
    console.error("🔥 Error fetching event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
