-- 002_seed.sql

-- Users
INSERT INTO users (id, name, email, role) VALUES
  (1, 'Admin Alice',    'admin@example.com',    'admin'),
  (3, 'Student Sam',    'student@example.com',  'student'),
  (4, 'Organizer Olivia','organizer@example.com','organizer')
ON CONFLICT (id) DO NOTHING;

-- Organizations
INSERT INTO organizations (name, description)
VALUES ('Student Union', 'Campus-wide student org')
ON CONFLICT (name) DO NOTHING;

-- Link user 4 as an organizer of Student Union
INSERT INTO organizers (user_id, org_id)
SELECT 4, o.id
FROM organizations o
WHERE o.name = 'Student Union'
ON CONFLICT DO NOTHING;

-- Two published events for Organizer Olivia
INSERT INTO events (org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status)
SELECT o.id, 'Hackathon', '48-hour coding event', 'Tech',
       NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 6 hours', 'Engineering Hall',
       150, 'free', 'published'
FROM organizations o WHERE o.name = 'Student Union'
ON CONFLICT DO NOTHING;

INSERT INTO events (org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status)
SELECT o.id, 'Music Night', 'Student bands performing', 'Entertainment',
       NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 3 hours', 'Main Auditorium',
       300, 'paid', 'published'
FROM organizations o WHERE o.name = 'Student Union'
ON CONFLICT DO NOTHING;
