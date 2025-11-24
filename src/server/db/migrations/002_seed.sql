BEGIN;

------------------------------------------------------------
-- USERS
------------------------------------------------------------
INSERT INTO users (id, name, email, role)
VALUES
  (1, 'Admin Alice',    'admin@example.com',    'admin'),
  (2, 'Student Sam',    'student@example.com',  'student'),
  (3, 'Organizer Olivia','organizer@example.com','organizer')
ON CONFLICT (id) DO NOTHING;


------------------------------------------------------------
-- ORGANIZATIONS
------------------------------------------------------------
INSERT INTO organizations (name, description)
VALUES
  ('Student Union', 'Campus-wide student organization'),
  ('Engineering Society', 'Faculty of Engineering'),
  ('CS Society', 'Computer Science student group')
ON CONFLICT (name) DO NOTHING;


------------------------------------------------------------
-- ORGANIZER → ORGANIZATION LINK
------------------------------------------------------------
-- Link Organizer Olivia (user_id=3) to Student Union
INSERT INTO organizers (user_id, org_id)
SELECT 3, o.id
FROM organizations o
WHERE o.name = 'Student Union'
ON CONFLICT DO NOTHING;


------------------------------------------------------------
-- EVENTS
------------------------------------------------------------
-- Add 2 published events for Student Union
INSERT INTO events (org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status)
SELECT o.id,
       'Hackathon', '48-hour coding challenge', 'Tech',
       NOW() + INTERVAL '7 days',
       NOW() + INTERVAL '7 days 6 hours',
       'Engineering Hall', 150, 'free', 'published'
FROM organizations o
WHERE o.name = 'Student Union'
ON CONFLICT DO NOTHING;

INSERT INTO events (org_id, title, description, category, start_at, end_at, location, capacity, ticket_type, status)
SELECT o.id,
       'Music Night', 'Live student performances', 'Entertainment',
       NOW() + INTERVAL '14 days',
       NOW() + INTERVAL '14 days 3 hours',
       'Main Auditorium', 300, 'paid', 'published'
FROM organizations o
WHERE o.name = 'Student Union'
ON CONFLICT DO NOTHING;


------------------------------------------------------------
-- TICKETS (optional demo tickets)
------------------------------------------------------------
INSERT INTO tickets (event_id, user_id, qr_token, status)
SELECT e.id, 2, 'QR_DEMO_1', 'claimed'
FROM events e
WHERE e.title = 'Hackathon'
ON CONFLICT DO NOTHING;

INSERT INTO tickets (event_id, user_id, qr_token, status)
SELECT e.id, 2, 'QR_DEMO_2', 'checked_in'
FROM events e
WHERE e.title = 'Music Night'
ON CONFLICT DO NOTHING;


------------------------------------------------------------
-- SAVED EVENTS (optional demo saves)
------------------------------------------------------------
INSERT INTO saves (user_id, event_id)
SELECT 2, e.id
FROM events e
WHERE e.title = 'Hackathon'
ON CONFLICT DO NOTHING;

COMMIT;
