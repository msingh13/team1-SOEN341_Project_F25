const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST /api/events/:eventId/waitlist/join
router.post("/events/:eventId/waitlist/join", async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const userId = Number(req.body.userId);

        console.log("➡️ eventId:", eventId);
        console.log("➡️ userId:", userId);

        // Check if user is already in waitlist (queued or offered)
        const existing = await pool.query(
            "SELECT id FROM waitlist_entries WHERE event_id = $1 AND user_id = $2 AND status IN ('queued', 'offered')",
            [eventId, userId]
        );

        if (existing.rows.length > 0) {
            return res.json({ success: true, message: "Already in waitlist" });
        }

        await pool.query(
            "INSERT INTO waitlist_entries (event_id, user_id, status) VALUES ($1, $2, 'queued')",
            [eventId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("🔥 JOIN WAITLIST ERROR:");
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// POST /api/events/:eventId/waitlist/leave
router.post("/events/:eventId/waitlist/leave", async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const userId = Number(req.body.userId);

        await pool.query(
            "DELETE FROM waitlist_entries WHERE event_id = $1 AND user_id = $2",
            [eventId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("🔥 LEAVE WAITLIST ERROR:");
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET /api/events/:eventId/waitlist/status
router.get("/events/:eventId/waitlist/status", async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const userId = Number(req.query.userId);

        const result = await pool.query(
            "SELECT status FROM waitlist_entries WHERE event_id = $1 AND user_id = $2",
            [eventId, userId]
        );

        if (result.rows.length > 0) {
            res.json({ status: result.rows[0].status });
        } else {
            res.json({ status: null });
        }
    } catch (err) {
        console.error("🔥 GET STATUS ERROR:");
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
