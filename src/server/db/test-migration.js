const { pool } = require('./index');
const fs = require('fs');
const path = require('path');

async function runTest() {
  try {
    console.log('Starting migration test...');

    // 1. Run Migrations
    const coreMigrationSql = fs.readFileSync(path.join(__dirname, 'migrations/create-core.sql'), 'utf8');
    await pool.query(coreMigrationSql);
    console.log('✅ Core migration applied.');

    const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations/create-waitlist.sql'), 'utf8');
    await pool.query(migrationSql);
    console.log('✅ Waitlist migration applied.');

    // 2. Verify Tables Exist
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('event_settings', 'waitlist_entries');
    `);
    if (tables.rows.length === 2) {
      console.log('✅ Tables created successfully.');
    } else {
      console.error('❌ Tables missing:', tables.rows);
    }

    // 3. Test Unique Constraint
    // First, ensure we have a dummy user and event
    // Note: This assumes users and events tables exist and have data or we insert dummy data.
    // For safety, we'll wrap in a transaction and rollback at the end.

    await pool.query('BEGIN');

    // Insert dummy data
    const userRes = await pool.query(`INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com') RETURNING id`);
    const orgRes = await pool.query(`INSERT INTO organizations (name) VALUES ('Test Org') RETURNING id`);
    const eventRes = await pool.query(`INSERT INTO events (org_id, title, start_at, capacity, ticket_type) VALUES ($1, 'Test Event', NOW(), 10, 'free') RETURNING id`, [orgRes.rows[0].id]);

    const userId = userRes.rows[0].id;
    const eventId = eventRes.rows[0].id;

    // Insert first entry
    await pool.query(`INSERT INTO waitlist_entries (event_id, user_id, status) VALUES ($1, $2, 'queued')`, [eventId, userId]);
    console.log('✅ First entry inserted.');

    // Try insert duplicate active entry
    try {
      await pool.query(`INSERT INTO waitlist_entries (event_id, user_id, status) VALUES ($1, $2, 'offered')`, [eventId, userId]);
      console.error('❌ Duplicate active entry check FAILED (should have thrown error).');
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        console.log('✅ Duplicate active entry correctly rejected.');
      } else {
        console.error('❌ Unexpected error:', err);
      }
    }

    await pool.query('ROLLBACK');
    console.log('✅ Test data rolled back.');

  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await pool.end();
  }
}

runTest();
