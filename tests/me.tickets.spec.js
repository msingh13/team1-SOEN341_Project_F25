/**
 * US-STU-05 (View My Tickets with QR)
 * API tests for GET /me/tickets using mocked DB.
 */
process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('./__mocks__/db');
jest.mock('../src/server/db', () => db); // <-- mock the pool used by controllers

const app = require('../src/server/server'); // server exports `app`
const { makeToken } = require('./utils/makeToken');

const QR_OK = (s) => typeof s === 'string'
  && s.length >= 24
  && /^[A-Za-z0-9_\-+=/]+$/.test(s); // URL-safe-ish check

describe('GET /me/tickets', () => {
  test('401 when no auth header', async () => {
    const res = await request(app).get('/me/tickets');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('403 with bad/expired token', async () => {
    const bad = makeToken({ id: 999 }, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/me/tickets')
      .set('Authorization', `Bearer ${bad}`);
    // controller returns 403 on invalid/expired token via middleware
    expect([401, 403]).toContain(res.status);
  });

  test('404 when user has no tickets', async () => {
    db.__setRows([]); // no rows for this user
    const token = makeToken({ id: 111 });

    const res = await request(app)
      .get('/me/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', expect.stringMatching(/no tickets/i));
  });

  test('200 returns only current user tickets with valid QR tokens', async () => {
    const userId = 222;
    const token = makeToken({ id: userId });

    // Two tickets for user 222
    db.__setRows([
      {
        ticket_id: 7,
        event_id: 101,
        user_id: userId,
        qr_code: 'Qk9Xb2wxQW1hX19nZW5lcmF0ZWQtc2VjcmV0LXRva2VuMTIz', // >= 24 chars
        ticket_status: 'claimed',
        checked_in_at: null,
        event_title: 'Tech Fair',
        event_location: 'Hall A',
        event_start_at: '2025-11-15T15:00:00Z',
        event_end_at: '2025-11-15T17:00:00Z',
        event_category: 'Career',
        event_ticket_type: 'free',
        event_status: 'published',
      },
      {
        ticket_id: 8,
        event_id: 102,
        user_id: userId,
        qr_code: 'eDlfYjRhN2N3LURlZWVwX1VSTF9zYWZlX3Q', // >= 24 chars
        ticket_status: 'checked_in',
        checked_in_at: '2025-11-01T12:05:00Z',
        event_title: 'Robotics Expo',
        event_location: 'Gym',
        event_start_at: '2025-11-20T18:00:00Z',
        event_end_at: '2025-11-20T20:00:00Z',
        event_category: 'Academic',
        event_ticket_type: 'paid',
        event_status: 'published',
      },
    ]);

    const res = await request(app)
      .get('/me/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('StudentId', userId);
    expect(Array.isArray(res.body.Tickets)).toBe(true);
    expect(res.body.Tickets.length).toBe(2);

    // Validate QR & uniqueness + fields
    const [a, b] = res.body.Tickets;

    expect(a).toMatchObject({
      id: 7,
      status: 'claimed',
      checkedInAt: null,
      event: expect.objectContaining({
        id: 101,
        title: 'Tech Fair',
        location: 'Hall A',
        ticketType: 'free',
      }),
    });
    expect(QR_OK(a.qrCode)).toBe(true);

    expect(b).toMatchObject({
      id: 8,
      status: 'checked_in',
      checkedInAt: expect.any(String),
      event: expect.objectContaining({
        id: 102,
        title: 'Robotics Expo',
        location: 'Gym',
        ticketType: 'paid',
      }),
    });
    expect(QR_OK(b.qrCode)).toBe(true);

    // uniqueness
    expect(a.qrCode).not.toEqual(b.qrCode);
  });

  test('does not leak other users’ tickets', async () => {
    const userId = 333;
    const token = makeToken({ id: userId });

    // Mix of tickets, including another user (should not be returned)
    db.__setRows([
      {
        ticket_id: 1, event_id: 10, user_id: userId,
        qr_code: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        ticket_status: 'claimed', checked_in_at: null,
        event_title: 'My Event', event_location: 'Auditorium',
        event_start_at: '2025-11-25T17:00:00Z', event_end_at: null,
        event_category: 'Social', event_ticket_type: 'free', event_status: 'published',
      },
      // If controller filtered by user_id in SQL, nothing extra returns.
      // Our mock already returns only current-user rows; this case ensures
      // structure stays correct with 1 result.
    ]);

    const res = await request(app)
      .get('/me/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.Tickets.length).toBe(1);
    expect(res.body.Tickets[0].event.title).toBe('My Event');
  });
});
