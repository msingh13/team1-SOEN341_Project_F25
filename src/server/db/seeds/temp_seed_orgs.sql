-- Seed organizations for reference
INSERT INTO orgs (id, name) VALUES
  (1001, 'Concordia CS'),
  (1002, 'Engineering Society'),
  (1003, 'Arts Students Assoc.')
ON CONFLICT (id) DO NOTHING;
