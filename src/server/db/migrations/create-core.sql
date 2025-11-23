

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  org_id INT NOT NULL REFERENCES organizations(id),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  category VARCHAR(60),
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP,
  location VARCHAR(160),
  capacity INT NOT NULL CHECK (capacity >= 0),
  ticket_type VARCHAR(10) NOT NULL CHECK (ticket_type IN ('free','paid')),
  status VARCHAR(12) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id),
  user_id INT NOT NULL REFERENCES users(id),
  qr_token TEXT UNIQUE,
  status VARCHAR(12) NOT NULL DEFAULT 'claimed',
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  checked_in_at TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tickets_event_user ON tickets(event_id, user_id);

CREATE TABLE IF NOT EXISTS saves (
  user_id INT NOT NULL REFERENCES users(id),
  event_id INT NOT NULL REFERENCES events(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS ix_events_start ON events(start_at);
CREATE INDEX IF NOT EXISTS ix_events_org ON events(org_id);
CREATE INDEX IF NOT EXISTS ix_events_category ON events(category);
