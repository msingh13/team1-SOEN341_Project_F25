-- Delete existing data (optional)
DELETE FROM tickets;
DELETE FROM events;
DELETE FROM organizations;

-- Insert one organization
INSERT INTO organizations (id, name, created_at)
VALUES (1, 'TechFest Org', NOW());

-- Insert three events linked to the organization
INSERT INTO events (id, org_id, title, start_at, end_at, created_at)
VALUES
(1, 1, 'AI Conference', '2025-10-01 18:00:00', '2025-10-01 21:00:00', NOW()),
(2, 1, 'Hackathon 2025', '2025-10-10 20:00:00', '2025-10-11 02:00:00', NOW()),
(3, 1, 'Startup Meetup', '2025-10-22 14:00:00', '2025-10-22 18:00:00', NOW());

-- Insert three tickets linked to events
INSERT INTO tickets (id, event_id, price, created_at)
VALUES
(1, 1, 25.00, '2025-09-25 10:00:00'),
(2, 1, 30.00, '2025-09-26 12:00:00'),
(3, 2, 20.00, '2025-10-05 09:00:00');
