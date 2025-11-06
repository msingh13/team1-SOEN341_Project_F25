// // tests/utils/seed.analytics.js
// const db = require("../../src/server/db");

// // wipe just the rows we create in these tests
// async function clearAll() {
//   await db.query("DELETE FROM tickets WHERE event_id >= 1000 AND event_id < 3000");
//   await db.query("DELETE FROM events  WHERE id       >= 1000 AND id       < 3000");
// }

// async function seedNoEvents() {
//   await clearAll();
// }

// // events exist, but no tickets claimed
// async function seedNoTickets() {
//   await clearAll();
//   await db.query(`
//     INSERT INTO events (id, title, start_at, capacity, status, org_id, ticket_type, location)
//     VALUES (1001, 'No Tickets Yet', NOW(), 100, 'published', 1, 'free', 'Room A')
//   `);
// }

// // 2 events, with issued/checked-in tickets so KPIs/trends are non-zero
// async function seedHappyPath() {
//   await clearAll();

//   // two published events
//   await db.query(`
//     INSERT INTO events (id, title, start_at, capacity, status, org_id, ticket_type, location)
//     VALUES
//       (2001, 'Hackathon Day 1', NOW() - INTERVAL '2 day', 100, 'published', 1, 'free', 'Hall 1'),
//       (2002, 'Hackathon Day 2', NOW() - INTERVAL '1 day',  80, 'published', 1, 'free', 'Hall 2')
//   `);

//   // issue two tickets for day 1 (one checked in)
//   await db.query(`
//     INSERT INTO tickets (event_id, user_id, status, qr_token)
//     VALUES
//       (2001, 5001, 'claimed',    't-2001-a'),
//       (2001, 5002, 'checked_in', 't-2001-b')
//   `);

//   // one ticket for day 2 (claimed)
//   await db.query(`
//     INSERT INTO tickets (event_id, user_id, status, qr_token)
//     VALUES (2002, 5003, 'claimed', 't-2002-a')
//   `);
// }

// module.exports = {
//   clearAll,
//   seedNoEvents,
//   seedNoTickets,
//   seedHappyPath,
// };
