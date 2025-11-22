require('dotenv').config();
const db = require('../index'); // Import DB connection

// Helper to generate random IDs for the 'users' table
const generateId = () => Math.floor(Math.random() * 1000000);

const seedSoldOutEvent = async () => {
  try {
    console.log('🌱 Seeding Sold-Out Event with Waitlist...');

    // 1. Create a User (The Organizer Person)
    const organizerEmail = `organizer_${Date.now()}@test.com`;
    const userId = generateId();
    await db.query(
      `INSERT INTO users (id, email, role, name) 
       VALUES ($1, $2, 'organizer', 'Test Organizer')`,
      [userId, organizerEmail]
    );
    console.log(`✅ Created Organizer User with ID: ${userId}`);

    // 2. Create an Organization (REQUIRED by the events table)
    const orgName = `Test Org ${Date.now()}`;
    const orgResult = await db.query(
        `INSERT INTO organizations (name, description) VALUES ($1, 'A seeded test org') RETURNING id`,
        [orgName]
    );
    const orgId = orgResult.rows[0].id;
    console.log(`✅ Created Organization with ID: ${orgId}`);

    // 3. Create the Sold-Out Event
    const eventResult = await db.query(
      `INSERT INTO events (title, description, location, capacity, org_id, start_at, category, ticket_type) 
       VALUES ('Taylor Swift Concert', 'Sold out event test', 'Montreal', 2, $1, NOW() + INTERVAL '30 days', 'Music', 'paid') 
       RETURNING id`,
      [orgId]
    );
    const eventId = eventResult.rows[0].id;
    console.log(`✅ Created Event ID: ${eventId} (Capacity: 2)`);

    // 4. Create 2 Users and fill the tickets
    for (let i = 1; i <= 2; i++) {
      const userEmail = `fan_${i}_${Date.now()}@test.com`;
      const fanId = generateId();

      await db.query(
        `INSERT INTO users (id, email, role, name) VALUES ($1, $2, 'student', 'Fan ${i}')`,
        [fanId, userEmail]
      );

      // FIX: Changed status from 'confirmed' to 'claimed' to match schema constraint
      await db.query(
        `INSERT INTO tickets (event_id, user_id, status, qr_token) VALUES ($1, $2, 'claimed', $3)`,
        [eventId, fanId, `qr_${Date.now()}_${i}`]
      );
    }
    console.log('✅ Filled event capacity with 2 tickets.');

    // 5. Create 3 Users and add them to Waitlist
    for (let i = 1; i <= 3; i++) {
      const waitEmail = `waitlist_${i}_${Date.now()}@test.com`;
      const waiterId = generateId();

      await db.query(
        `INSERT INTO users (id, email, role, name) VALUES ($1, $2, 'student', 'Waiter ${i}')`,
        [waiterId, waitEmail]
      );

      // Try to insert into waitlist
      try {
        await db.query(
            `INSERT INTO waitlist (event_id, user_id) VALUES ($1, $2)`,
            [eventId, waiterId]
        );
        console.log(`✅ Added User ${waiterId} to waitlist.`);
      } catch (err) {
          console.warn(`⚠️ Could not add to waitlist (Table might not exist). Skipped User ${waiterId}.`);
      }
    }

    console.log('🎉 Seeding Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
};

seedSoldOutEvent();
