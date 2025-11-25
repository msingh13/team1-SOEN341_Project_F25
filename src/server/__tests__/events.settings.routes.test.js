// src/server/__tests__/events.settings.routes.test.js
const express = require("express");
const request = require("supertest");

// mock DB
jest.mock("../db", () => ({
  query: jest.fn(),
}));
const pool = require("../db");

// auth stub as organizer
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 2, role: "organizer" };
    next();
  },
  requireRoles: () => (_req, _res, next) => next(),
}));

const settingsRouter = require("../routes/events.settings.routes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/events", settingsRouter);
  return app;
}

describe("Event settings (waitlist)", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("GET /events/:id/settings – 400 on invalid id", async () => {
    const app = makeApp();

    const res = await request(app).get("/events/not-a-number/settings");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });

  test("POST /events/:id/settings – saves valid waitlist configuration", async () => {
    const app = makeApp();

    // requireOwnedEvent() → one row
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // ownership
      .mockResolvedValueOnce({
        // INSERT .. ON CONFLICT RETURNING
        rows: [
          {
            waitlist_enabled: true,
            offer_window_minutes: 60,
            max_waitlist: 20,
          },
        ],
      });

    const body = {
      waitlist_enabled: true,
      offer_window_minutes: 60,
      max_waitlist: 20,
    };

    const res = await request(app).post("/events/10/settings").send(body);

    expect(res.status).toBe(200);
    expect(res.body.settings).toMatchObject({
      waitlist_enabled: true,
      offer_window_minutes: 60,
      max_waitlist: 20,
    });
  });
});
