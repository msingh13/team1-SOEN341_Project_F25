-- Seed multiple categories, orgs, and dates for /events testing
WITH series AS (
  SELECT gs AS n,
         (now() - interval '90 days') + (gs || ' hours')::interval AS start_ts
  FROM generate_series(1, 540) gs
),
picked AS (
  SELECT
    s.n,
    (ARRAY['music','sports','tech','career','social','academic'])[1 + (random()*5)::int] AS category,
    (ARRAY[1001,1002,1003])[1 + (random()*2)::int] AS org_id,
    CASE
      WHEN s.n % 10 = 0 THEN 'cancelled'
      WHEN s.n % 7  = 0 THEN 'private'
      WHEN s.n % 3  = 0 THEN 'draft'
      ELSE 'published'
    END AS status,
    s.start_ts AS start_at,
    s.start_ts + interval '2 hours' AS end_at
  FROM series s
)
INSERT INTO events (title, category, org_id, status, start_at, end_at, venue, created_at, updated_at)
SELECT
  'Event #' || n || ' — ' || initcap(category),
  category,
  org_id,
  status,
  start_at,
  end_at,
  'Hall ' || ((n % 12) + 1),
  now(),
  now()
FROM picked
ON CONFLICT DO NOTHING;
