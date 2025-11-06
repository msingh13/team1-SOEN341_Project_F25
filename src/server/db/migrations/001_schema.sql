-- 001_schema.sql

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('student','organizer','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORGANIZERS (your code: SELECT id FROM organizers WHERE user_id=$1)
CREATE TABLE IF NOT EXISTS organizers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE (user_id, org_id)
);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  org_id INT NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  capacity INT NOT NULL CHECK (capacity >= 0),
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('free','paid')),
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','published','rejected')) DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id),
  user_id INT NOT NULL REFERENCES users(id),
  qr_token TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('claimed','checked_in','cancelled')) DEFAULT 'claimed',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tickets_event_user ON tickets(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON tickets(qr_token);

-- SAVES (bookmarks)
CREATE TABLE IF NOT EXISTS saves (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS ix_saves_user  ON saves(user_id);
CREATE INDEX IF NOT EXISTS ix_saves_event ON saves(event_id);

-- MODERATION LOGS (admin publish/reject)
CREATE TABLE IF NOT EXISTS moderation_logs (
  id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES users(id),
  event_id INT NOT NULL REFERENCES events(id),
  action   TEXT NOT NULL CHECK (action IN ('publish','reject')),
  reason   TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_mlogs_event ON moderation_logs(event_id);
CREATE INDEX IF NOT EXISTS ix_mlogs_admin ON moderation_logs(admin_id);

-- Helpful event indexes
CREATE INDEX IF NOT EXISTS ix_events_start     ON events(start_at);
CREATE INDEX IF NOT EXISTS ix_events_category  ON events(category);
CREATE INDEX IF NOT EXISTS ix_events_org       ON events(org_id);
CREATE INDEX IF NOT EXISTS ix_events_status    ON events(status);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();
