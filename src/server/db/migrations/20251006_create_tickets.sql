-- Events capacity & issued (safe-guarded)
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS issued   INTEGER NOT NULL DEFAULT 0;

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL,
  qr_token   TEXT    NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
