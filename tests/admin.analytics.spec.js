// // tests/admin.analytics.spec.js
// const request = require("supertest");

// jest.mock("../src/server/middleware/auth", () => {
//   return (req, _res, next) => {
//     req.user = { id: 999, role: "admin" };
//     next();
//   };
// });
// jest.mock("../src/server/middleware/requireAdmin", () => {
//   return (_req, _res, next) => next();
// });

// // require app AFTER mocks
// const app = require("../src/server/server");
// const db = require("../src/server/db");

// const {
//   seedNoEvents,
//   seedNoTickets,
//   seedHappyPath,
// } = require("./utils/seed.analytics");

// afterAll(async () => {
//   // close DB to avoid open handles
//   if (db?.pool?.end) await db.pool.end();
// });

// describe("GET /admin", () => {
//   test("zero state when there are no events", async () => {
//     await seedNoEvents();

//     const res = await request(app).get("/admin");
//     expect(res.status).toBe(200);
//     expect(res.body).toMatchObject({
//       eventsTotal: 0,
//       ticketsIssued: 0,
//       ticketsCheckedIn: 0,
//     });
//     expect(Array.isArray(res.body.trendDaily)).toBe(true);
//   });

//   test("events exist but no tickets → KPIs are 0", async () => {
//     await seedNoTickets();

//     const res = await request(app).get("/admin");
//     expect(res.status).toBe(200);
//     expect(typeof res.body.eventsTotal).toBe("number");
//     expect(res.body.eventsTotal).toBeGreaterThanOrEqual(1);
//     expect(res.body.ticketsIssued).toBe(0);
//     expect(res.body.ticketsCheckedIn).toBe(0);
//   });

//   test("happy path metrics and trends match seeded data", async () => {
//     await seedHappyPath();

//     const res = await request(app).get("/admin");
//     expect(res.status).toBe(200);

//     // With the seed above: 2 events, 3 tickets issued, 1 checked in
//     expect(res.body).toMatchObject({
//       eventsTotal: 2,
//       ticketsIssued: 3,
//       ticketsCheckedIn: 1,
//     });

//     expect(Array.isArray(res.body.trendDaily)).toBe(true);
//   });
// });

// describe("authz: only admins may access /admin", () => {
//   test("non-admin is forbidden (403)", async () => {
//     // Rewire modules for this single test: valid user but not admin
//     jest.isolateModules(() => {
//       jest.resetModules();

//       jest.doMock("../src/server/middleware/auth", () => {
//         return (req, _res, next) => {
//           req.user = { id: 123, role: "user" }; // valid token but not admin
//           next();
//         };
//       });
//       // use real admin gate
//       jest.dontMock("../src/server/middleware/requireAdmin");

//       const appFresh = require("../src/server/server");
//       return request(appFresh).get("/admin").then((res) => {
//         expect(res.status).toBe(403);
//       });
//     });
//   });
// });
