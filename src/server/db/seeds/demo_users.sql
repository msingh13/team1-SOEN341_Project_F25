-- demo_users.sql

INSERT INTO users (id, name, email, password_hash, role, approved, student_id)
VALUES
  (1, 'Admin Alice',     'admin@example.com',     '', 'admin',     TRUE, NULL),
  (3, 'Student Sam',     'student@example.com',   '', 'student',   TRUE, 'S123456'),
  (4, 'Organizer Olivia','organizer@example.com', '', 'organizer', TRUE, NULL)
ON CONFLICT (id) DO UPDATE
SET
  name     = EXCLUDED.name,
  email    = EXCLUDED.email,
  role     = EXCLUDED.role,
  approved = EXCLUDED.approved;

-- Ensure a demo organization exists
INSERT INTO organizations (name, description)
VALUES ('Engineering Society', 'Faculty engineering student org')
ON CONFLICT (name) DO NOTHING;

-- Link user 4 as organizer in that org
INSERT INTO user_org_roles (org_id, user_id, role)
SELECT o.id, 4, 'organizer'
FROM organizations o
WHERE o.name = 'Engineering Society'
ON CONFLICT (org_id, user_id) DO UPDATE
SET role = EXCLUDED.role;
