-- Adds helpful indexes for attendee export (US-ORG-04)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_event_id 
  ON tickets(event_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_user_id 
  ON tickets(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_event_user_cover
  ON tickets(event_id, user_id)
  INCLUDE (status, issued_at, checked_in_at);


