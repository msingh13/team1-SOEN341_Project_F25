const db = require("../db");

exports.listSubmitted = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.id, e.title, e.category, e.location, e.start_at, e.status,
              o.name AS organizer
         FROM events e
         LEFT JOIN organizations o ON o.id = e.org_id
        WHERE e.status = 'submitted'
        ORDER BY e.start_at ASC NULLS LAST, e.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("admin listSubmitted", err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to load submitted events" });
  }
};

exports.globalStats = async (req, res) => {
  try {
    const [{ rows: ev }, { rows: tk }, { rows: ci }] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS c FROM events`),
      db.query(`SELECT COUNT(*)::int AS c FROM tickets`),
      db.query(`SELECT COUNT(*)::int AS c FROM tickets WHERE status = 'checked_in'`)
    ]);
    res.json({
      events: ev[0].c,
      tickets: tk[0].c,
      checkedIn: ci[0].c,
    });
  } catch (err) {
    console.error("admin globalStats", err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to load stats" });
  }
};
