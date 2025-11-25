-- reset_and_seed.sql
-- Full drop + recreate + seed for Campus Events backend

BEGIN;

---------------------------------------------------
-- DROP TABLES (in FK-safe order)
---------------------------------------------------
DROP TABLE IF EXISTS event_waitlist_audit CASCADE;
DROP TABLE IF EXISTS event_waitlist CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;
DROP TABLE IF EXISTS saves CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS waitlist_policy_audit CASCADE;
DROP TABLE IF EXISTS waitlist_policy CASCADE;
DROP TABLE IF EXISTS moderation_logs CASCADE;
DROP TABLE IF EXISTS organizer_requests CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

---------------------------------------------------
-- USERS
---------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student', -- 'student' | 'organizer' | 'admin'
  approved      BOOLEAN NOT NULL DEFAULT FALSE,
  student_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

---------------------------------------------------
-- ORGANIZATIONS (ADMIN-MANAGED)
---------------------------------------------------
CREATE TABLE organizations (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

---------------------------------------------------
-- ORGANIZERS (MAP USER → ORGANIZATION)
---------------------------------------------------
CREATE TABLE organizers (
  id       SERIAL PRIMARY KEY,
  user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id   INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_organizers_user ON organizers(user_id);
CREATE INDEX ix_organizers_org  ON organizers(org_id);

---------------------------------------------------
-- EVENTS
---------------------------------------------------
CREATE TABLE events (
  id            SERIAL PRIMARY KEY,
  org_id        INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  start_at      TIMESTAMPTZ,
  end_at        TIMESTAMPTZ,
  location      TEXT,
  capacity      INT NOT NULL CHECK (capacity > 0),
  ticket_type   TEXT NOT NULL DEFAULT 'free', -- 'free' | 'paid' (mock)
  status        TEXT NOT NULL DEFAULT 'submitted', -- 'submitted' | 'published' | 'rejected'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- simple per-event waitlist fields used by some routes
  waitlist_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  waitlist_offer_window  INT,
  waitlist_queue_cap     INT,
  max_waitlist           INT
);

CREATE INDEX ix_events_status    ON events(status);
CREATE INDEX ix_events_category  ON events(category);
CREATE INDEX ix_events_start_at  ON events(start_at);
CREATE INDEX ix_events_org       ON events(org_id);

---------------------------------------------------
-- TICKETS
---------------------------------------------------
CREATE TABLE tickets (
  id             SERIAL PRIMARY KEY,
  event_id       INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_token       TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'claimed', -- 'claimed' | 'checked_in' | 'canceled'
  issued_at      TIMESTAMPTZ,
  checked_in_at  TIMESTAMPTZ,
  offer_id       INT, -- optional FK into offers.id (not enforced)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tickets_event    ON tickets(event_id);
CREATE INDEX ix_tickets_user     ON tickets(user_id);
CREATE INDEX ix_tickets_status   ON tickets(status);

---------------------------------------------------
-- SAVES (BOOKMARKS)
---------------------------------------------------
CREATE TABLE saves (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX ix_saves_event ON saves(event_id);

---------------------------------------------------
-- PER-EVENT SETTINGS (used by events.settings.routes.js)
---------------------------------------------------
CREATE TABLE event_settings (
  event_id             INT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  waitlist_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  offer_window_minutes INT NOT NULL DEFAULT 60,
  max_waitlist         INT
);

---------------------------------------------------
-- WAITLIST ENTRIES (student-side + organizer-side)
---------------------------------------------------
CREATE TABLE event_waitlist (
  id          BIGSERIAL PRIMARY KEY,
  event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'queued', -- 'queued' | 'promoted' | 'removed' | 'offered' | 'expired'
  position    INT NOT NULL DEFAULT 0,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_event_waitlist_user_event
  ON event_waitlist(event_id, user_id);

CREATE INDEX ix_event_waitlist_event_created
  ON event_waitlist(event_id, created_at);

---------------------------------------------------
-- WAITLIST AUDIT (organizer actions: promote/remove)
---------------------------------------------------
CREATE TABLE event_waitlist_audit (
  id         BIGSERIAL PRIMARY KEY,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  waitlist_id BIGINT REFERENCES event_waitlist(id) ON DELETE SET NULL,
  actor_id   INT REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL, -- 'promote' | 'remove' | etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_event_waitlist_audit_event ON event_waitlist_audit(event_id);

---------------------------------------------------
-- GLOBAL WAITLIST POLICY
---------------------------------------------------
CREATE TABLE waitlist_policy (
  id          SERIAL PRIMARY KEY,
  max_size    INT,
  auto_promote BOOLEAN NOT NULL DEFAULT FALSE,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE waitlist_policy_audit (
  id          SERIAL PRIMARY KEY,
  admin_id    INT REFERENCES users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_value   JSONB,
  new_value   JSONB
);

CREATE INDEX ix_waitlist_policy_audit_admin ON waitlist_policy_audit(admin_id);

---------------------------------------------------
-- MODERATION LOGS (admin publishes/rejects events)
---------------------------------------------------
CREATE TABLE moderation_logs (
  id         SERIAL PRIMARY KEY,
  admin_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  action     TEXT NOT NULL, -- 'publish' | 'reject' | etc
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_moderation_logs_event ON moderation_logs(event_id);
CREATE INDEX ix_moderation_logs_admin ON moderation_logs(admin_id);

---------------------------------------------------
-- ORGANIZER REQUESTS (from /auth/request-organizer)
---------------------------------------------------
CREATE TABLE organizer_requests (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_organizer_requests_user   ON organizer_requests(user_id);
CREATE INDEX ix_organizer_requests_status ON organizer_requests(status);

---------------------------------------------------
-- OFFERS (used by offers.js)
---------------------------------------------------
CREATE TABLE offers (
  id          SERIAL PRIMARY KEY,
  event_id    INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at     TIMESTAMPTZ,
  capacity    INT,
  max_waitlist INT
);

CREATE INDEX ix_offers_event ON offers(event_id);
CREATE INDEX ix_offers_user  ON offers(user_id);

---------------------------------------------------
-- SEED DATA
---------------------------------------------------

-- USERS
INSERT INTO users (id, name, email, password_hash, role, approved, student_id)
VALUES
  (1, 'Admin User',     'admin@example.com',     '$2a$10$dummyhashadminxxxxxxxxxxxxxx',   'admin',     TRUE, NULL),
  (2, 'Organizer One',  'organizer@example.com', '$2a$10$dummyhashorganizerxxxxxxxxx',   'organizer', TRUE, NULL),
  (3, 'Student One',    'student@example.com',   '$2a$10$dummyhashstudentxxxxxxxxxxx',   'student',   TRUE, 'S123456');

SELECT setval('users_id_seq', 3, true);

-- ORGANIZATIONS
INSERT INTO organizations (id, name, description)
VALUES
  (1, 'Student Union', 'Campus-wide org'),
  (2, 'CS Society',    'Computer Science Student Society');

SELECT setval('organizations_id_seq', 2, true);

-- ORGANIZERS (map organizer user → org)
INSERT INTO organizers (id, user_id, org_id)
VALUES
  (1, 2, 1);

SELECT setval('organizers_id_seq', 1, true);

-- EVENTS
-- 1: Published & SOLD OUT (capacity 2, 2 tickets) → used to test waitlist
-- 2: Published with free capacity → used to test ticket claiming
-- 3: Submitted (for moderation / publish / reject)
INSERT INTO events
  (id, org_id, title, description, category,
   start_at, end_at, location, capacity, ticket_type, status,
   waitlist_enabled, waitlist_offer_window, waitlist_queue_cap, max_waitlist)
VALUES
  (
    1,
    1,
    'Homecoming Party',
    'Big campus homecoming event.',
    'Social',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 3 hours',
    'Hall A',
    2,
    'free',
    'published',
    TRUE,
    60,
    10,
    10
  ),
  (
    2,
    1,
    'Career Fair',
    'Meet employers and learn about opportunities.',
    'Career',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days 4 hours',
    'Auditorium',
    100,
    'free',
    'published',
    FALSE,
    NULL,
    NULL,
    NULL
  ),
  (
    3,
    1,
    'Hackathon',
    '24-hour coding competition.',
    'Tech',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '21 days 24 hours',
    'Lab 301',
    50,
    'free',
    'submitted',
    FALSE,
    NULL,
    NULL,
    NULL
  );

SELECT setval('events_id_seq', 3, true);

-- TICKETS
-- Event 1 (capacity 2) → SOLD OUT
INSERT INTO tickets
  (id, event_id, user_id, qr_token, status, issued_at, checked_in_at)
VALUES
  (1, 1, 3, 'QR_HOME_1', 'claimed',   NOW() - INTERVAL '1 day', NULL),
  (2, 1, 2, 'QR_HOME_2', 'checked_in',NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

SELECT setval('tickets_id_seq', 2, true);

-- SAVES (Student saved Event 2)
INSERT INTO saves (user_id, event_id)
VALUES (3, 2);

-- EVENT SETTINGS (for event 1 – explicit waitlist settings)
INSERT INTO event_settings (event_id, waitlist_enabled, offer_window_minutes, max_waitlist)
VALUES (1, TRUE, 60, 20);

-- GLOBAL WAITLIST POLICY
INSERT INTO waitlist_policy (max_size, auto_promote, enabled)
VALUES (50, TRUE, TRUE);

INSERT INTO waitlist_policy_audit (admin_id, old_value, new_value)
VALUES
  (
    1,
    NULL,
    '{"maxSize":50,"autoPromote":true,"enabled":true}'::jsonb
  );

-- ORGANIZER REQUESTS
INSERT INTO organizer_requests (user_id, org_name, status)
VALUES
  (3, 'Math Club', 'pending');

COMMIT;
