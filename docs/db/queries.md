## STU-02-DB — Remaining Capacity Query

**Purpose:** Compute how many seats remain for an event.

**Formula:** `remaining = capacity - tickets_claimed`

**SQL (single event):**

```sql
SELECT
  e.id AS event_id,
  e.capacity,
  COALESCE(COUNT(t.id), 0) AS tickets_claimed,
  GREATEST(0, e.capacity - COALESCE(COUNT(t.id), 0)) AS remaining
FROM events e
LEFT JOIN tickets t
  ON t.event_id = e.id
  AND t.status = 'claimed'  -- count only claimed tickets
WHERE e.id = $1              -- replace with a specific event id
GROUP BY e.id, e.capacity;
```
