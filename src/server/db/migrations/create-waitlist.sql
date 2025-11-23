CREATE TABLE IF NOT EXISTS event_settings (
  event_id INT PRIMARY KEY REFERENCES events(id),
  is_waitlist_enabled BOOLEAN DEFAULT FALSE,
  waitlist_capacity INT,
  auto_offer_enabled BOOLEAN DEFAULT FALSE,
  offer_duration_hours INT
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id),
  user_id INT NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'offered', 'expired', 'removed', 'converted')),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_waitlist_event ON waitlist_entries(event_id);
CREATE INDEX IF NOT EXISTS ix_waitlist_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS ix_waitlist_joined ON waitlist_entries(joined_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_waitlist_active 
ON waitlist_entries(event_id, user_id) 
WHERE status IN ('queued', 'offered');
