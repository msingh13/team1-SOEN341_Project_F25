BEGIN;

-- 1) organizer_requests needs decided_at (used by approve/reject)
ALTER TABLE IF EXISTS organizer_requests
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

-- 2) users needs updated_at (approve route updates it)
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;

-- 3) user_org_roles table (approve route inserts here)
CREATE TABLE IF NOT EXISTS user_org_roles (
  org_id  INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  role    TEXT NOT NULL CHECK (role IN ('member','organizer','admin')),
  PRIMARY KEY (org_id, user_id)
);

COMMIT;
