-- Users (very simple for now)
CREATE TABLE IF NOT EXISTS users (
  id           BIGINT PRIMARY KEY,
  role         TEXT NOT NULL DEFAULT 'user',
  verified     BOOLEAN NOT NULL DEFAULT true
);

-- Organizations (optional for filters)
CREATE TABLE IF NOT EXISTS orgs (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id              BIGSERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  organizer       TEXT,
  org_id          BIGINT REFERENCES orgs(id),
  location        TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  capacity        INT NOT NULL DEFAULT 100,
  remaining_seats INT NOT NULL DEFAULT 100,
  ticket_type     TEXT NOT NULL DEFAULT 'free',
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved events (bookmarks)
CREATE TABLE IF NOT EXISTS saves (
  user_id   BIGINT REFERENCES users(id),
  event_id  BIGINT REFERENCES events(id),
  saved_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  event_id    BIGINT REFERENCES events(id),
  status      TEXT NOT NULL DEFAULT 'claimed', -- claimed / checked-in / cancelled
  qr_code     TEXT NOT NULL,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indices
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published)
  WHERE is_published = true;
