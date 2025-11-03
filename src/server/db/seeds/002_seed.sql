INSERT INTO users (id, role, verified) VALUES (1, 'user', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orgs (name) VALUES
  ('CSU'), ('ECA'), ('IEEE'), ('CASA'), ('Sports Union')
ON CONFLICT DO NOTHING;

INSERT INTO events (title, description, category, organizer, org_id, location, start_time, end_time, capacity, remaining_seats, ticket_type, is_published)
VALUES
  ('Hack the Night: 6-Hour Hackathon', 'Sprint with friends, prizes at the end.', 'Academic', 'CSU', (SELECT id FROM orgs WHERE name=''CSU''), 'Hall H-110',
    now() + interval ''1 day'', now() + interval ''1 day 3 hours'', 120, 120, 'free', true),
  ('Intramural Basketball Finals', 'Cheer the finalists!', 'Sports', 'Sports Union', (SELECT id FROM orgs WHERE name=''Sports Union''), 'Gym Loyola',
    now() + interval ''2 days'', now() + interval ''2 days 2 hours'', 200, 180, 'free', true),
  ('Resume Roast & Recruiting', 'Get your resume reviewed, meet recruiters.', 'Career', 'CASA', (SELECT id FROM orgs WHERE name=''CASA''), 'MB 2.210',
    now() + interval ''3 days'', now() + interval ''3 days 2 hours'', 80, 40, 'free', true),
  ('Robotics Club Demo Day', 'Line-following, sumo bots & more.', 'Club', 'IEEE', (SELECT id FROM orgs WHERE name=''IEEE''), 'EV 7.745',
    now() + interval ''5 days'', now() + interval ''5 days 2 hours'', 100, 90, 'free', true),
  ('Social Night: Board Games', 'Chill games & pizza.', 'Social', 'ECA', (SELECT id FROM orgs WHERE name=''ECA''), 'Hall H-763',
    now() + interval ''7 days'', now() + interval ''7 days 3 hours'', 60, 60, 'free', true);
