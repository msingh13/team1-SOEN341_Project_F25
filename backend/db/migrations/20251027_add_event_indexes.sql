-- Add index on org_id
CREATE INDEX IF NOT EXISTS idx_events_org_id
ON events(org_id);

-- Add index on start_at
CREATE INDEX IF NOT EXISTS idx_events_start_at
ON events(start_at);

CREATE INDEX IF NOT EXISTS idx_events_start_desc
ON events(start_at DESC);
