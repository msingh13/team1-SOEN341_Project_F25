-- Minimal users table (only if it doesn't exist yet)
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('student','organizer','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo users (ids chosen to match what you’ve been using)
INSERT INTO users (id, name, email, role) VALUES
  (1, 'Admin Alice',    'admin@example.com',    'admin'),
  (3, 'Student Sam',    'student@example.com',  'student'),
  (4, 'Organizer Olivia','organizer@example.com','organizer')
ON CONFLICT (id) DO NOTHING;

-- (Optional) Organizations, if you have FKs to them elsewhere
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- (Optional) Organizer role mapping if your schema needs it
CREATE TABLE IF NOT EXISTS user_org_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role    TEXT NOT NULL CHECK (role IN ('admin','organizer','member')),
  UNIQUE (user_id, org_id, role)
);

-- Add a demo org + link the organizer
INSERT INTO organizations (name, description)
VALUES ('Engineering Society', 'Faculty engineering student org')
ON CONFLICT DO NOTHING;

-- Link user 4 as organizer (ignore if duplicates)
INSERT INTO user_org_roles (user_id, org_id, role)
SELECT 4, o.id, 'organizer'
FROM organizations o
WHERE o.name = 'Engineering Society'
ON CONFLICT DO NOTHING;
