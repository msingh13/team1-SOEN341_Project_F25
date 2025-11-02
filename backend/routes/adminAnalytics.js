import express from "express";
import db from "../database.js";

const router = express.Router();

router.get("/admin/analytics", async (req, res) => {
  try {
    const totalEvents = await db.query("SELECT COUNT(*) AS total_events FROM events;");
    const totalTickets = await db.query("SELECT COUNT(*) AS total_tickets FROM tickets;");
    const totalRevenue = await db.query("SELECT COALESCE(SUM(price), 0) AS total_revenue FROM tickets;");
    const weeklyTrends = await db.query(`
      SELECT DATE_TRUNC('week', start_at) AS week_start, COUNT(*) AS events_this_week
      FROM events
      GROUP BY week_start
      ORDER BY week_start;
    `);

    res.json({
      totalEvents: totalEvents.rows[0].total_events,
      totalTickets: totalTickets.rows[0].total_tickets,
      totalRevenue: totalRevenue.rows[0].total_revenue,
      weeklyTrends: weeklyTrends.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
