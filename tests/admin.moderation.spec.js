// tests/admin.moderation.spec.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/server/server'); // module.exports = app in server.js
const dbMock = require('./__mocks__/db');    // to reset between tests

function tokenFor(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('US-ADM-02 Moderate Event Listings', () => {
  beforeEach(() => {
    dbMock.__data.reset();
  });

  describe('POST /admin/events/:id/publish', () => {
    it('publishes a pending event (happy path)', async () => {
      const res = await request(app)
        .post('/admin/events/101/publish')
        .set('Authorization', `Bearer ${tokenFor(1)}`); // admin

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        code: 'PUBLISHED',
        eventId: 101,
        status: 'published'
      });

      // DB side-effect
      const ev = dbMock.__data.events.find(e => e.id === 101);
      expect(ev.status).toBe('published');

      // moderation log written
      const log = dbMock.__data.logs.find(l => l.event_id === 101 && l.action === 'publish');
      expect(log).toBeTruthy();
      expect(log.admin_id).toBe(1);
      expect(log.reason).toBe(null);
    });

    it('returns 409 if already published', async () => {
      const res = await request(app)
        .post('/admin/events/102/publish') // already published
        .set('Authorization', `Bearer ${tokenFor(1)}`);

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        code: 'INVALID_STATUS'
      });
    });

    it('returns 404 if event not found', async () => {
      const res = await request(app)
        .post('/admin/events/9999/publish')
        .set('Authorization', `Bearer ${tokenFor(1)}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('requires admin (student gets 403)', async () => {
      const res = await request(app)
        .post('/admin/events/101/publish')
        .set('Authorization', `Bearer ${tokenFor(2)}`); // student

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('requires auth (no token → 401)', async () => {
      const res = await request(app)
        .post('/admin/events/101/publish');

      expect(res.status).toBe(401);
      // middleware returns { message } — still fine for the acceptance criteria
      expect(res.body.message).toBeDefined();
    });

    it('invalid id → 400', async () => {
      const res = await request(app)
        .post('/admin/events/not-a-number/publish')
        .set('Authorization', `Bearer ${tokenFor(1)}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });
  });

  describe('POST /admin/events/:id/reject', () => {
    it('rejects a pending event with reason', async () => {
      const res = await request(app)
        .post('/admin/events/101/reject')
        .send({ reason: 'Insufficient details' })
        .set('Authorization', `Bearer ${tokenFor(1)}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        code: 'REJECTED',
        eventId: 101,
        status: 'rejected',
        reason: 'Insufficient details'
      });

      const ev = dbMock.__data.events.find(e => e.id === 101);
      expect(ev.status).toBe('rejected');

      const log = dbMock.__data.logs.find(l => l.event_id === 101 && l.action === 'reject');
      expect(log).toBeTruthy();
      expect(log.reason).toBe('Insufficient details');
    });

    it('requires a reason (400)', async () => {
      const res = await request(app)
        .post('/admin/events/101/reject')
        .send({})
        .set('Authorization', `Bearer ${tokenFor(1)}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('cannot reject if already rejected/published (409)', async () => {
      const res1 = await request(app)
        .post('/admin/events/102/reject') // already published
        .send({ reason: 'Too late' })
        .set('Authorization', `Bearer ${tokenFor(1)}`);
      expect(res1.status).toBe(409);

      const res2 = await request(app)
        .post('/admin/events/103/reject') // already rejected
        .send({ reason: 'Already rejected' })
        .set('Authorization', `Bearer ${tokenFor(1)}`);
      expect(res2.status).toBe(409);
    });

    it('requires admin (student → 403)', async () => {
      const res = await request(app)
        .post('/admin/events/101/reject')
        .send({ reason: 'Nope' })
        .set('Authorization', `Bearer ${tokenFor(2)}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('requires auth (no token → 401)', async () => {
      const res = await request(app)
        .post('/admin/events/101/reject')
        .send({ reason: 'No token' });
      expect(res.status).toBe(401);
    });

    it('invalid id → 400', async () => {
      const res = await request(app)
        .post('/admin/events/not-a-number/reject')
        .send({ reason: 'x' })
        .set('Authorization', `Bearer ${tokenFor(1)}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('404 if event not found', async () => {
      const res = await request(app)
        .post('/admin/events/7777/reject')
        .send({ reason: 'Missing' })
        .set('Authorization', `Bearer ${tokenFor(1)}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });
});
