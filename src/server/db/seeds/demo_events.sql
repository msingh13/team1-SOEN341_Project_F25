INSERT INTO organizations (name, description)
VALUES ('Student Union', 'Campus student group')
ON CONFLICT DO NOTHING;

INSERT INTO events (org_id, title, description, category, start_at, location, capacity, ticket_type, status)
VALUES
(1, 'Hackathon', '48-hour coding challenge', 'Tech', NOW() + INTERVAL '7 days', 'Engineering Hall', 150, 'free', 'published'),
(1, 'Campus Concert', 'Live music night with student bands', 'Entertainment', NOW() + INTERVAL '14 days', 'Main Auditorium', 300, 'paid', 'published')
ON CONFLICT DO NOTHING;
