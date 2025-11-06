// src/server/controllers/moderation.controller.js
const pool = require("../db");

// helpers
function send(res, status, code, message, details) {
  const body = { code, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

// POST /admin/events/:id/publish
exports.publishEvent = async (req, res) => {
  const adminId = req.user?.id;            // ✅ JWT user id from auth middleware
  const eventId = Number(req.params.id);

  if (!Number.isFinite(adminId)) return send(res, 401, "UNAUTHORIZED", "Login required");
  if (!Number.isFinite(eventId)) return send(res, 400, "BAD_REQUEST", "Invalid event id");

  try {
    // (Optional) sanity user check (role already validated by requireAdmin)
    const u = await pool.query("SELECT id FROM users WHERE id = $1", [adminId]);
    if (u.rowCount === 0) return send(res, 401, "UNAUTHORIZED", "User not found");

    // Must be in 'submitted'
    const ev = await pool.query("SELECT id, status FROM events WHERE id = $1", [eventId]);
    if (ev.rowCount === 0) return send(res, 404, "NOT_FOUND", "Event not found");
    if (ev.rows[0].status !== "submitted") {
      return send(res, 409, "INVALID_STATUS", "Event must be 'submitted' to publish", { currentStatus: ev.rows[0].status });
    }

    const up = await pool.query(
      "UPDATE events SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING id, status",
      [eventId]
    );

    // ⚠️ Make sure this table name matches your migration (moderation_logs vs event_moderation_log)
    await pool.query(
      `INSERT INTO moderation_logs (admin_id, event_id, action, reason, created_at)
       VALUES ($1, $2, 'publish', NULL, NOW())`,
      [adminId, eventId]
    );

    return res.json({
      code: "PUBLISHED",
      message: "Event published successfully",
      eventId: up.rows[0].id,
      status: up.rows[0].status,
    });
  } catch (err) {
    console.error("publishEvent error:", err);
    return send(res, 500, "INTERNAL_ERROR", "Unexpected error");
  }
};

// POST /admin/events/:id/reject
exports.rejectEvent = async (req, res) => {
  const adminId = req.user?.id;            // ✅ JWT user id
  const eventId = Number(req.params.id);
  const reason = (req.body?.reason || "").toString().trim().slice(0, 500);

  if (!Number.isFinite(adminId)) return send(res, 401, "UNAUTHORIZED", "Login required");
  if (!Number.isFinite(eventId)) return send(res, 400, "BAD_REQUEST", "Invalid event id");
  if (!reason) return send(res, 400, "BAD_REQUEST", "Rejection reason is required");

  try {
    const u = await pool.query("SELECT id FROM users WHERE id = $1", [adminId]);
    if (u.rowCount === 0) return send(res, 401, "UNAUTHORIZED", "User not found");

    const ev = await pool.query("SELECT id, status FROM events WHERE id = $1", [eventId]);
    if (ev.rowCount === 0) return send(res, 404, "NOT_FOUND", "Event not found");
    if (ev.rows[0].status !== "submitted") {
      return send(res, 409, "INVALID_STATUS", "Event must be 'submitted' to reject", { currentStatus: ev.rows[0].status });
    }

    const up = await pool.query(
      "UPDATE events SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING id, status",
      [eventId]
    );

    await pool.query(
      `INSERT INTO moderation_logs (admin_id, event_id, action, reason, created_at)
       VALUES ($1, $2, 'reject', $3, NOW())`,
      [adminId, eventId, reason]
    );

    return res.json({
      code: "REJECTED",
      message: "Event rejected",
      eventId: up.rows[0].id,
      status: up.rows[0].status,
      reason,
    });
  } catch (err) {
    console.error("rejectEvent error:", err);
    return send(res, 500, "INTERNAL_ERROR", "Unexpected error");
  }
};
