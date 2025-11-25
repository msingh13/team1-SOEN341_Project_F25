// src/server/__tests__/events.routes.test.js
const express = require("express");
const request = require("supertest");

jest.mock("../db", () => ({
  query: jest.fn(),
}));
const db = require("../db");

const eventsRouter = require("../routes/events");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/events", eventsRouter);
  return app;
}

describe("Public events routes", () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  test("GET /events – returns paginated published events", async () => {
    const app = makeApp();

    // first query: COUNT(*)
    db.query
      .mockResolvedValueOnce({ rows: [{ c: 1 }] })
      // second query: data rows
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            title: "Homecoming",
            description: "Party",
            start_at: "2025-01-01T18:00:00Z",
            end_at: "2025-01-01T21:00:00Z",
            capacity: 100,
            tickets_issued: 10,
            remaining_seats: 90,
            location: "Hall A",
            category: "Social",
            org_id: 1,
            organizer: "Student Union",
          },
        ],
      });

    const res = await request(app)
      .get("/events")
      .query({ page: 1, perPage: 12, category: "Social" });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      id: 1,
      title: "Homecoming",
      remaining_seats: 90,
      category: "Social",
    });
  });

  test("GET /events/:id – returns 404 for unpublished event", async () => {
    const app = makeApp();

    // event exists but status not 'published'
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          title: "Draft Event",
          status: "submitted",
        },
      ],
    });

    const res = await request(app).get("/events/2");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
