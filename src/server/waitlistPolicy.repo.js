// server/waitlistPolicy.repo.js
const pool = require("./db");

/**
 * Get the most recent global waitlist policy.
 * Returns null if none exists yet.
 */
async function getGlobalWaitlistPolicy() {
  const result = await pool.query(
    `
    SELECT id,
           max_size,
           auto_promote,
           enabled,
           updated_at
    FROM waitlist_policy
    ORDER BY updated_at DESC
    LIMIT 1
    `
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    maxSize: row.max_size,
    autoPromote: row.auto_promote,
    enabled: row.enabled,
    updatedAt: row.updated_at,
  };
}

/**
 * Insert a new global policy and write an audit record.
 * Returns the new policy object.
 *
 * payload: { maxSize, autoPromote, enabled }
 */
async function upsertGlobalWaitlistPolicy(payload, adminId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const previous = await client.query(
      `
      SELECT max_size, auto_promote, enabled, updated_at
      FROM waitlist_policy
      ORDER BY updated_at DESC
      LIMIT 1
      `
    );

    const oldValue =
      previous.rows.length > 0
        ? {
            maxSize: previous.rows[0].max_size,
            autoPromote: previous.rows[0].auto_promote,
            enabled: previous.rows[0].enabled,
            updatedAt: previous.rows[0].updated_at,
          }
        : null;

    const insertPolicy = await client.query(
      `
      INSERT INTO waitlist_policy (max_size, auto_promote, enabled)
      VALUES ($1, $2, $3)
      RETURNING id, max_size, auto_promote, enabled, updated_at
      `,
      [payload.maxSize ?? null, payload.autoPromote, payload.enabled]
    );

    const newRow = insertPolicy.rows[0];
    const newValue = {
      maxSize: newRow.max_size,
      autoPromote: newRow.auto_promote,
      enabled: newRow.enabled,
      updatedAt: newRow.updated_at,
    };

    await client.query(
      `
      INSERT INTO waitlist_policy_audit
        (admin_id, old_value, new_value)
      VALUES ($1, $2::jsonb, $3::jsonb)
      `,
      [adminId, JSON.stringify(oldValue), JSON.stringify(newValue)]
    );

    await client.query("COMMIT");

    return {
      id: newRow.id,
      maxSize: newRow.max_size,
      autoPromote: newRow.auto_promote,
      enabled: newRow.enabled,
      updatedAt: newRow.updated_at,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Query audit history with filters + pagination.
 * params: { adminId?, from?, to?, page?, pageSize? }
 */
async function queryWaitlistAudit(params = {}) {
  const {
    adminId,
    from,
    to,
    page = 1,
    pageSize = 20,
  } = params;

  const limit = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;

  const conditions = [];
  const values = [];
  let idx = 1;

  if (adminId) {
    conditions.push(`admin_id = $${idx++}`);
    values.push(adminId);
  }

  if (from) {
    conditions.push(`changed_at >= $${idx++}`);
    values.push(from);
  }

  if (to) {
    conditions.push(`changed_at <= $${idx++}`);
    values.push(to);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      id,
      admin_id,
      changed_at,
      old_value,
      new_value,
      COUNT(*) OVER() AS total_count
    FROM waitlist_policy_audit
    ${whereClause}
    ORDER BY changed_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const result = await pool.query(query, values);

  const rows = result.rows.map((row) => ({
    id: row.id,
    adminId: row.admin_id,
    changedAt: row.changed_at,
    oldValue: row.old_value,
    newValue: row.new_value,
  }));

  const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  return {
    items: rows,
    page: Number(page),
    pageSize: limit,
    total,
  };
}

module.exports = {
  getGlobalWaitlistPolicy,
  upsertGlobalWaitlistPolicy,
  queryWaitlistAudit,
};
