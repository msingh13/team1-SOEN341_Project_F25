-- ADM-01-BE migration

-- 1) Add status + audit columns to organizers
ALTER TABLE organizers
  ADD COLUMN IF NOT EXISTS organizer_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_organizers_status ON organizers(organizer_status);

-- 2) Moderation log table for audit trail
CREATE TABLE IF NOT EXISTS moderation_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,        -- e.g. 'organizer'
  target_id INTEGER NOT NULL,
  action TEXT NOT NULL,             -- 'approve_organizer' | 'reject_organizer'
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_target ON moderation_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_admin ON moderation_log(admin_id);
