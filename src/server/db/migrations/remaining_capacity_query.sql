-- 002_remaining_capacity_query.sql
-- Purpose: Compute remaining capacity for events.
-- Task: STU-02-DB (Add DB query for remaining capacity)
-- ------------------------------------------------------
-- This query calculates remaining seats for any given event:
-- remaining = capacity - tickets_claimed
-- where tickets_claimed = COUNT(*) of claimed tickets per event.
-- Index on (event_id) in tickets ensures performance.

-- Example query:
SELECT
  e.id AS event_id,
  e.capacity,
  COALESCE(COUNT(t.id), 0) AS tickets_claimed,
  GREATEST(0, e.capacity - COALESCE(COUNT(t.id), 0)) AS remaining
FROM events e
LEFT JOIN tickets t
  ON t.event_id = e.id
  AND t.status = 'claimed'
WHERE e.id = $1
GROUP BY e.id, e.capacity;

-- No schema changes required (index already present: ux_tickets_event_user).