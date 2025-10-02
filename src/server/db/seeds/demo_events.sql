INSERT INTO organizations (id, name, description) VALUES
(1, 'Student Union', 'Campus-wide student org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (org_id, title, description, category, start_at, location, capacity, ticket_type, status)
VALUES
(1, 'Hackathon', '48-hour coding event', 'Tech', NOW() + INTERVAL '7 days', 'Engineering Hall', 150, 'free', 'published'),
(1, 'Music Night', 'Student bands performing', 'Entertainment', NOW() + INTERVAL '14 days', 'Main Auditorium', 300, 'paid', 'published')
ON CONFLICT DO NOTHING;
