// src/server/__tests__/admin.analytics.routes.test.js
const express = require("express");
const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
}));
const pool = require("../db");

// auth stub: admin user
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 1, role: "admin" };
    next();
  },
  requireRoles: () => (req, _res, next) => next(),
}));

const adminAnalyticsRouter = require("../routes/admin.analytics.routes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/", adminAnalyticsRouter);
  return app;
}

describe("Admin global stats", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("GET /admin/stats – aggregates totals and participation_rate", async () => {
    const app = makeApp();

    // order of calls in route:
    // 1) total_events
    // 2) total_tickets
    // 3) total_users
    // 4) by_day
    // 5) issued_today
    // 6) participation_rate
    pool.query
      .mockResolvedValueOnce({ rows: [{ total_events: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total_tickets: 5 }] })
      .mockResolvedValueOnce({ rows: [{ total_users: 4 }] })
      .mockResolvedValueOnce({
        rows: [{ day: "2025-01-01", issued: 3 }],
      })
      .mockResolvedValueOnce({
        rows: [{ issued_today: 2 }],
      })
      .mockResolvedValueOnce({
        rows: [{ rate: 0.5 }],
      });

    const res = await request(app).get("/admin/stats");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_events: 3,
      total_tickets: 5,
      total_users: 4,
      issued_today: 2,
      participation_rate: 50,
    });
    expect(Array.isArray(res.body.by_day)).toBe(true);
  });
});
