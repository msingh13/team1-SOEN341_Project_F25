// Uses your existing pg Pool exported from src/server/db/index.js
const { pool } = require("./index"); // ⬅️ if your pool is exported elsewhere, adjust this path

/**
 * Run a function inside a DB transaction.
 * Provides a dedicated `client` to your callback.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
