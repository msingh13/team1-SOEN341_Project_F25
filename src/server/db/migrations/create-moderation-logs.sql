-- Purpose: store a history of admin moderation actions on events.

CREATE TABLE IF NOT EXISTS moderation_logs (
  id           SERIAL PRIMARY KEY,
  admin_id     INTEGER NOT NULL REFERENCES users(id),
  event_id     INTEGER NOT NULL REFERENCES events(id),
  action       VARCHAR(12) NOT NULL CHECK (action IN ('publish','reject')),
  reason       TEXT NULL,                         -- only needed for rejects
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Helpful indexes for querying logs by event/admin
CREATE INDEX IF NOT EXISTS ix_mlogs_event ON moderation_logs(event_id);
CREATE INDEX IF NOT EXISTS ix_mlogs_admin ON moderation_logs(admin_id);