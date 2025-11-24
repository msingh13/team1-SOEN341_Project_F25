BEGIN;

---------------------------------------------------------
-- USERS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','organizer','admin')),
  password_hash TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT TRUE,
  student_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

---------------------------------------------------------
-- ORGANIZATIONS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

---------------------------------------------------------
-- ORGANIZERS (link user → org)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organizer_status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by INTEGER REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by INTEGER REFERENCES users(id),
  UNIQUE (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_organizers_status ON organizers(organizer_status);

---------------------------------------------------------
-- ORGANIZER REQUESTS (used by /auth/request-organizer)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizer_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  UNIQUE (user_id, org_name)
);

---------------------------------------------------------
-- USER ORG ROLES (admin/organizer/member)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_org_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','organizer','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, org_id, role)
);

---------------------------------------------------------
-- EVENTS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('free','paid')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','published','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_events_start     ON events(start_at);
CREATE INDEX IF NOT EXISTS ix_events_category  ON events(category);
CREATE INDEX IF NOT EXISTS ix_events_org       ON events(org_id);
CREATE INDEX IF NOT EXISTS ix_events_status    ON events(status);
CREATE INDEX IF NOT EXISTS ix_events_org_status ON events(org_id, status);

---------------------------------------------------------
-- EVENT updated_at trigger
---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_events_updated_at();

---------------------------------------------------------
-- EVENT MODERATION LOG
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_moderation_log (
  id BIGSERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('publish','reject')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_eml_event      ON event_moderation_log(event_id);
CREATE INDEX IF NOT EXISTS ix_eml_created_at ON event_moderation_log(created_at);

---------------------------------------------------------
-- TICKETS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  qr_token TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('claimed','checked_in','cancelled')) DEFAULT 'claimed',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tickets_event_user ON tickets(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON tickets(event_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON tickets(qr_token);

---------------------------------------------------------
-- SAVED EVENTS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

---------------------------------------------------------
-- OFFERS (waitlist → ticket offer flow)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_ticket_id INTEGER REFERENCES tickets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_offer_per_user_event UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_offers_token ON offers(token);
CREATE INDEX IF NOT EXISTS idx_offers_event ON offers(event_id);
CREATE INDEX IF NOT EXISTS idx_offers_user ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_valid ON offers(event_id, expires_at) WHERE used_at IS NULL;

---------------------------------------------------------
-- EVENT WAITLISTS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_waitlists (
  id BIGSERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','offered','accepted','expired','cancelled','declined')),
  queue_position INT NOT NULL,
  offer_token TEXT UNIQUE,
  offer_expires_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_evt_waitlist_event_user
ON event_waitlists(event_id, user_id)
WHERE status IN ('queued','offered','accepted');

CREATE INDEX IF NOT EXISTS ix_evt_waitlist_event_status ON event_waitlists(event_id, status);
CREATE INDEX IF NOT EXISTS ix_evt_waitlist_offer_expires ON event_waitlists(status, offer_expires_at);

---------------------------------------------------------
-- WAITLIST SETTINGS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_waitlist_settings (
  event_id INT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  max_queue_length INT CHECK (max_queue_length IS NULL OR max_queue_length >= 0),
  offer_window_minutes INT NOT NULL DEFAULT 60
);

---------------------------------------------------------
-- WAITLIST POLICY + AUDIT
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist_policy (
  id SERIAL PRIMARY KEY,
  max_size INTEGER,
  auto_promote BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist_policy_audit (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_value JSONB,
  new_value JSONB
);

COMMIT;
