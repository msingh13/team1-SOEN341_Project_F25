-- WAITLIST SETTINGS (matches backend: events.waitlist.routes.js)
CREATE TABLE IF NOT EXISTS event_waitlist_settings (
  event_id           INT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  offer_window       INT CHECK (offer_window > 0),
  queue_cap          INT CHECK (queue_cap >= 0),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BASIC WAITLIST TABLE (matches backend)
CREATE TABLE IF NOT EXISTS event_waitlist (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event_joined
  ON event_waitlist(event_id, joined_at);
