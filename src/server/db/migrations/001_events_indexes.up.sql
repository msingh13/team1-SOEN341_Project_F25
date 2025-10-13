-- Minimal indexes for filter performance

CREATE INDEX IF NOT EXISTS idx_events_start_at ON events (start_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_org_id ON events (org_id);

-- Partial index for public browse
CREATE INDEX IF NOT EXISTS idx_events_published_start_at
  ON events (start_at)
  WHERE status = 'published';
