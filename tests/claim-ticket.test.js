const request = require("supertest");
const app = require("../src/server/server"); 

const USER_ID = 12345;    
const EVENT_ID = 1;      
async function loginById(id) {
  const res = await request(app).post("/dev/login").send({ id });
  expect(res.status).toBeLessThan(400);
  expect(res.body.token).toBeTruthy();
  return res.body.token;
}

async function getEvent(id) {
  return request(app).get(`/events/${id}`);
}

describe("POST /events/:id/tickets — claim flow", () => {
  let token;

  beforeAll(async () => {
    token = await loginById(USER_ID);

    const ev = await getEvent(EVENT_ID);
    expect([200, 403, 404]).toContain(ev.status);
    if (ev.status === 200) {
      expect(ev.body).toHaveProperty("remaining_seats");
    } else if (ev.status === 403) {
      throw new Error("Event is not published. Set events.status='published' for EVENT_ID.");
    } else if (ev.status === 404) {
      throw new Error("Event not found. Use an existing EVENT_ID.");
    }
  });

  test("rejects without token", async () => {
    const res = await request(app).post(`/events/${EVENT_ID}/tickets`);
    expect([401, 403]).toContain(res.status);
  });

  test("claims a ticket and decrements remaining seats", async () => {
    // before
    const before = await getEvent(EVENT_ID);
    expect(before.status).toBe(200);
    const beforeRemaining = before.body.remaining_seats;
    expect(typeof beforeRemaining).toBe("number");
    expect(beforeRemaining).toBeGreaterThan(0);

    // claim
    const claim = await request(app)
      .post(`/events/${EVENT_ID}/tickets`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect([200, 201]).toContain(claim.status);
    expect(claim.body).toHaveProperty("ticketId");
    expect(claim.body).toHaveProperty("qrToken");

    // after
    const after = await getEvent(EVENT_ID);
    expect(after.status).toBe(200);
    expect(after.body.remaining_seats).toBe(beforeRemaining - 1);
  });

  test("duplicate claim returns conflict-like error", async () => {
    const again = await request(app)
      .post(`/events/${EVENT_ID}/tickets`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect([400, 409]).toContain(again.status);
    expect(again.body.code).toBeDefined();
  });

  test("non-existent event returns not found / bad request", async () => {
    const res = await request(app)
      .post(`/events/999999/tickets`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect([404, 400]).toContain(res.status);
  });
});
