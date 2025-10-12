// Purpose:
//   Handles admin moderation actions for events (publish/reject).
//   This section covers the "publish" endpoint.
//
// Notes:
//   - Includes inline admin check (no external middleware).
//   - Ensures the event exists and is in 'submitted' status before publishing.
//   - Updates the event status to 'published'.
//   - Logs the action in the moderation_logs table.
// -------------------------------------------------------------

const pool = require("../db"); // Import the shared PostgreSQL pool connection

// Helper function to extract the current user's ID from the x-user-id header
function getCurrentUserId(req) {
  const headerVal = req.header("x-user-id");
  return headerVal ? parseInt(headerVal, 10) : null;
}

// -------------------------------------------------------------
// POST /admin/events/:id/publish
// -------------------------------------------------------------
// This endpoint:
//   - Verifies that the request comes from an admin user
//   - Checks that the event exists and is in 'submitted' status
//   - Updates the event to 'published'
//   - Logs the moderation action in the database
// -------------------------------------------------------------
exports.publishEvent = async (req, res) => {
  const adminId = getCurrentUserId(req); // Read current user ID from header
  const eventId = parseInt(req.params.id, 10); // Extract event ID from URL

  // -------------------------------------------------------------
  // 1. Basic request validation
  // -------------------------------------------------------------
  if (!adminId) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
  }
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });
  }

  try {
    // -------------------------------------------------------------
    // 2. Verify the user's role (must be admin)
    // -------------------------------------------------------------
    const { rows: userRows } = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [adminId]
    );
    const user = userRows[0];

    if (!user) {
      // User not found in database
      return res.status(401).json({ code: "UNAUTHORIZED", message: "User not found" });
    }
    if (String(user.role).toLowerCase() !== "admin") {
      // User is logged in but not an admin
      return res.status(403).json({ code: "FORBIDDEN", message: "Admin only" });
    }

    // -------------------------------------------------------------
    // 3. Load event and ensure it's in 'submitted' status
    // -------------------------------------------------------------
    const { rows: evRows } = await pool.query(
      "SELECT id, status FROM events WHERE id = $1",
      [eventId]
    );
    const ev = evRows[0];

    if (!ev) {
      // Event does not exist
      return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (ev.status !== "submitted") {
      // Event exists but is already published or rejected
      return res.status(409).json({
        code: "INVALID_STATUS",
        message: "Event must be in 'submitted' status to publish",
        details: { currentStatus: ev.status },
      });
    }

    // -------------------------------------------------------------
    // 4. Update event status to 'published'
    // -------------------------------------------------------------
    const { rows: upRows } = await pool.query(
      "UPDATE events SET status = 'published' WHERE id = $1 RETURNING id, status",
      [eventId]
    );
    const updated = upRows[0]; // Get the updated event data

    // -------------------------------------------------------------
    // 5. Insert a moderation log entry
    // -------------------------------------------------------------
    await pool.query(
      `INSERT INTO moderation_logs (admin_id, event_id, action, reason)
       VALUES ($1, $2, 'publish', NULL)`,
      [adminId, eventId]
    );

    // -------------------------------------------------------------
    // 6. Send success response
    // -------------------------------------------------------------
    return res.json({
      code: "PUBLISHED",
      message: "Event published successfully",
      eventId: updated.id,
      status: updated.status,
    });
  } catch (err) {
    // Catch any database or logic errors
    console.error(err);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unexpected error" });
  }
};

// -------------------------------------------------------------
// POST /admin/events/:id/reject
// -------------------------------------------------------------
exports.rejectEvent = async (req, res) => {
  const adminId = getCurrentUserId(req);
  const eventId = parseInt(req.params.id, 10);
  const reasonRaw = (req.body?.reason ?? "").toString().trim();

  // 1) Basic validation
  if (!adminId) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
  }
  if (!Number.isFinite(eventId)) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid event id" });
  }
  if (!reasonRaw) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Rejection reason is required" });
  }
  // (Optional) basic length limit to avoid spammy huge payloads
  const reason = reasonRaw.slice(0, 500);

  try {
    // 2) Admin role check
    const { rows: userRows } = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [adminId]
    );
    const user = userRows[0];
    if (!user) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "User not found" });
    }
    if (String(user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ code: "FORBIDDEN", message: "Admin only" });
    }

    // 3) Load event and status pre-check
    const { rows: evRows } = await pool.query(
      "SELECT id, status FROM events WHERE id = $1",
      [eventId]
    );
    const ev = evRows[0];
    if (!ev) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (ev.status !== "submitted") {
      return res.status(409).json({
        code: "INVALID_STATUS",
        message: "Event must be in 'submitted' status to reject",
        details: { currentStatus: ev.status },
      });
    }

    // 4) Update status -> 'rejected'
    const { rows: upRows } = await pool.query(
      "UPDATE events SET status = 'rejected' WHERE id = $1 RETURNING id, status",
      [eventId]
    );
    const updated = upRows[0];

    // 5) Log moderation action with reason
    await pool.query(
      `INSERT INTO moderation_logs (admin_id, event_id, action, reason)
       VALUES ($1, $2, 'reject', $3)`,
      [adminId, eventId, reason]
    );

    // 6) Respond
    return res.json({
      code: "REJECTED",
      message: "Event rejected",
      eventId: updated.id,
      status: updated.status,
      reason,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unexpected error" });
  }
};