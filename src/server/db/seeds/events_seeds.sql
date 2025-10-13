-- Simple seed data to cover multiple categories, orgs, and dates
INSERT INTO events (title, category, org_id, status, start_at, end_at, venue)
VALUES
  ('Tech Talk',      'tech',      '11111111-1111-1111-1111-111111111111', 'published', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 'Hall A'),
  ('Art Exhibit',    'arts',      '22222222-2222-2222-2222-222222222222', 'published', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 3 hours', 'Gallery 1'),
  ('Business Meetup','business',  '33333333-3333-3333-3333-333333333333', 'draft',     NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', 'Conference Rm'),
  ('Music Festival', 'music',     '44444444-4444-4444-4444-444444444444', 'published', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 4 hours', 'Main Stage'),
  ('AI Workshop',    'tech',      '11111111-1111-1111-1111-111111111111', 'published', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 'Lab B')
ON CONFLICT DO NOTHING;
