// --- Event Analytics for Organizer ---
router.get("/org/events/:id/analytics", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const eventId = Number(req.params.id);
  
    if (!Number.isFinite(eventId))
      return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event ID" });
  
    try {
      // Verify organizer ownership
      const orgCheck = await pool.query(
        `SELECT o.id
           FROM organizers o
           JOIN events e ON e.org_id = o.id
          WHERE e.id = $1 AND o.user_id = $2`,
        [eventId, userId]
      );
  
      if (orgCheck.rowCount === 0)
        return res.status(403).json({ code: "FORBIDDEN", message: "Not your event" });
  
      // Fetch analytics data
      const { rows } = await pool.query(
        `
        SELECT
          e.id,
          e.title,
          e.capacity,
          COUNT(t.id)::int AS total_tickets,
          COUNT(t_checked.id)::int AS checked_in,
          GREATEST(0, e.capacity - COUNT(t.id))::int AS remaining
        FROM events e
        LEFT JOIN tickets t ON t.event_id = e.id
        LEFT JOIN tickets t_checked ON t_checked.event_id = e.id AND t_checked.status = 'checked_in'
        WHERE e.id = $1
        GROUP BY e.id, e.title, e.capacity
        `,
        [eventId]
      );
  
      if (!rows.length)
        return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
  
      const r = rows[0];
      const attendanceRate =
        r.total_tickets === 0 ? 0 : Math.round((r.checked_in / r.total_tickets) * 100);
  
      res.json({
        id: r.id,
        title: r.title,
        capacity: r.capacity,
        totalTickets: r.total_tickets,
        checkedIn: r.checked_in,
        remaining: r.remaining,
        attendanceRate,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res
        .status(500)
        .json({ code: "INTERNAL_ERROR", message: "Failed to load analytics", details: err.message });
    }
  });
  