-- Index for filtering tickets by event
CREATE INDEX IF NOT EXISTS idx_tickets_event_id 
ON tickets(event_id);

-- Index for fast filtering of checked-in tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status 
ON tickets(status);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_tickets_event_status
ON tickets(event_id, status);
