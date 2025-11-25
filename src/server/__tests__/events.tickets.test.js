// src/server/__tests__/events.tickets.test.js
const express = require("express");
const request = require("supertest");

// mock DB pool
jest.mock("../db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));
const pool = require("../db");

// mock auth: always a logged-in student or organizer
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 3, role: "student" };
    next();
  },
  requireRoles: () => (req, _res, next) => next(),
}));

const ticketsRouter = require("../routes/events.tickets");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/", ticketsRouter);
  return app;
}

describe("Ticket routes", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("POST /events/:id/tickets – happy path issues a ticket", async () => {
    const app = makeApp();

    // 1) event capacity / issued
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 2, capacity: 100, issued: 0 }],
      })
      // 2) existing ticket?
      .mockResolvedValueOnce({ rows: [] })
      // 3) insert ticket
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            event_id: 2,
            qr_token: "QR_TEST",
            issued_at: "2025-01-01T00:00:00Z",
          },
        ],
      });

    const res = await request(app).post("/events/2/tickets").send({});

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ticketId: 10,
      eventId: 2,
      qrToken: "QR_TEST",
    });

    // should have called DB three times
    expect(pool.query).toHaveBeenCalledTimes(3);
  });

  test("POST /events/:id/tickets – returns SOLD_OUT when capacity reached", async () => {
    const app = makeApp();

    // event is full: issued >= capacity
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, capacity: 2, issued: 2 }],
    });

    const res = await request(app).post("/events/1/tickets").send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("SOLD_OUT");
  });

  test("POST /events/:id/tickets – prevents duplicate claim", async () => {
    const app = makeApp();

    // 1) event still has capacity
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, capacity: 10, issued: 1 }],
      })
      // 2) existing ticket row
      .mockResolvedValueOnce({ rows: [{ id: 99 }] });

    const res = await request(app).post("/events/1/tickets").send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("ALREADY_CLAIMED");
  });
});
