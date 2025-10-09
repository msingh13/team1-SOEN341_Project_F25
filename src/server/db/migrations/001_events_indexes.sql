-- Index on event start time for range queries and ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_start_at
  ON events (start_at);

-- Index on category for equality filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_category
  ON events (category);

-- Index on org_id for equality filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_org_id
  ON events (org_id);

-- Partial index for public browsing (status='published')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_published_start_at
  ON events (start_at)
  WHERE status = 'published';
