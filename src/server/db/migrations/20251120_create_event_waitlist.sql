-- 20251120_create_event_waitlist.sql

CREATE TABLE IF NOT EXISTS event_waitlist (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- Index to speed up position lookup
CREATE INDEX IF NOT EXISTS idx_event_waitlist_event_joined
  ON event_waitlist (event_id, joined_at);
