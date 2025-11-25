# Testing Summary – Sprint 4

This page summarizes the testing strategy for the **Campus Events & Ticketing** system in Sprint 4.

We focus on four levels of testing:

- **Unit tests** (backend)
- **Integration / API tests**
- **System / end-to-end flows**
- **User acceptance tests** based on user stories

---

## 1. Scope of Testing

**Backend (Node/Express + PostgreSQL)**

- Routes:
  - `/events` public browsing and filters
  - `/events/:id` event detail
  - `/events/:id/tickets` ticket claiming
  - `/me/tickets` ticket listing
  - `/org/events` organizer dashboard + analytics
  - `/admin/stats` admin analytics
  - `/events/:id/settings` per-event waitlist settings
- Core components:
  - Authentication middleware (`middleware/auth.js`)
  - DB Pool wrapper (`db.js`)

**Frontend (React + TypeScript)**

- Screen flows:
  - Student browse → event detail → claim ticket → view QR code
  - Organizer create event → view analytics → export CSV
  - Admin approvals and moderation dashboard
  - Waitlist management flow (join waitlist → promote → claim)

---

## 2. Unit & Integration Tests (Automated)

We use **Jest** + **Supertest** for backend tests.

Main test files:

1. `src/server/__tests__/events.tickets.test.js`  
   Tests ticket claiming rules (capacity, sold-out, duplicate tickets) for `POST /events/:id/tickets`.

2. `src/server/__tests__/events.routes.test.js`  
   Tests public event listing and detail routes (`GET /events`, `GET /events/:id`), including unpublished events returning 404.

3. `src/server/__tests__/orgEvents.analytics.test.js`  
   Tests organizer analytics (`GET /api/org/events/:id/analytics`) including remaining capacity and attendance rate calculations.

4. `src/server/__tests__/admin.analytics.routes.test.js`  
   Tests admin global stats (`GET /admin/stats`) including total events, tickets, users, issued_today and participation_rate.

5. `src/server/__tests__/events.settings.routes.test.js`  
   Tests per-event waitlist settings (`GET/POST /events/:id/settings`) including validation for offer window and max waitlist.

**How we run them locally**

```bash
cd src/server
npm test
