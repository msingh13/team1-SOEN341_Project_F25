-- US-STU-03: Create saves table (user "saves" an event to personal list)
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS saves (
  user_id  INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_saves PRIMARY KEY (user_id, event_id)
);

-- Helpful indexes (the PK already indexes both columns together; these help filtered lookups)
CREATE INDEX IF NOT EXISTS ix_saves_user  ON saves(user_id);
CREATE INDEX IF NOT EXISTS ix_saves_event ON saves(event_id);
