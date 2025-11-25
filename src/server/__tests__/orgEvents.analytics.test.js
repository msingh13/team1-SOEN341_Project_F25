// src/server/__tests__/orgEvents.analytics.test.js
const express = require("express");
const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
}));
const pool = require("../db");

// auth stub: logged-in organizer user_id = 2
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 2, role: "organizer" };
    next();
  },
}));

const orgEventsRouter = require("../routes/orgEvents");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/org/events", orgEventsRouter);
  return app;
}

describe("Organizer event analytics", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("GET /api/org/events/:id/analytics – computes remaining capacity & attendance", async () => {
    const app = makeApp();

    // 1) ownership check
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 5, start_at: "2099-01-01T10:00:00Z" }],
      })
      // 2) aggregation query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            capacity: 100,
            tickets_issued: 40,
            tickets_checked_in: 20,
          },
        ],
      });

    const res = await request(app).get("/api/org/events/5/analytics");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      tickets_issued: 40,
      tickets_checked_in: 20,
      remaining_capacity: 60,
      attendance_rate: 50, // 20/40 * 100
    });
  });
});
