// server/db/queries/audit.js
const db = require('../index');

/**
 * Logs an action into audit_logs table.
 *
 * @param {string} action       - Action type (e.g., 'DELETE_EVENT', 'PUBLISH_EVENT')
 * @param {number} performedBy  - User ID who performed the action
 * @param {number|null} targetId - (Optional) ID of the affected record
 * @param {object|null} details  - (Optional) extra metadata (stored as JSON)
 */
exports.logAction = async (action, performedBy, targetId = null, details = null) => {
  try {
    const sql = `
      INSERT INTO audit_logs (action, performed_by, target_id, details, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    await db.query(sql, [
      action,
      performedBy,
      targetId,
      details ? JSON.stringify(details) : null
    ]);

    console.log(`[AUDIT] ${action} logged by user ${performedBy}`);
  } catch (err) {
    console.error('[AUDIT ERROR] Failed to record audit:', err.message);
  }
};
