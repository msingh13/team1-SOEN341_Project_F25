const db = require('../index'); // Imports the database connection

/**
 * Logs an action to the audit_logs table.
 * * @param {string} action - The type of action (e.g., 'DELETE_EVENT')
 * @param {number} performedBy - The ID of the user performing the action
 * @param {number|null} targetId - (Optional) The ID of the object affected
 * @param {object|null} details - (Optional) Extra details object to store as JSON
 */
exports.logAction = async (action, performedBy, targetId = null, details = null) => {
  try {
    const query = `
      INSERT INTO audit_logs (action, performed_by, target_id, details)
      VALUES (?, ?, ?, ?)
    `;
    
    // Convert details object to a JSON string if it exists
    const detailsString = details ? JSON.stringify(details) : null;

    await db.run(query, [action, performedBy, targetId, detailsString]);
    console.log(`[AUDIT] Action logged: ${action} by User ${performedBy}`);
  } catch (err) {
    console.error('[AUDIT ERROR] Failed to log action:', err);
    // We do not throw the error because auditing failing shouldn't crash the main app flow
  }
};