
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);


CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
