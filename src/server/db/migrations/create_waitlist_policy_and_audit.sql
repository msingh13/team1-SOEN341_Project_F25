-- server/db/migrations/20251123_create_waitlist_policy_and_audit.sql

CREATE TABLE IF NOT EXISTS waitlist_policy (
  id SERIAL PRIMARY KEY,
  max_size INTEGER,
  auto_promote BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist_policy_audit (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_value JSONB,
  new_value JSONB
);
