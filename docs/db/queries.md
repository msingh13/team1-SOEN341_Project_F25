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


## attendees_by_event (US-ORG-04)

**Purpose:** Return attendee details for a given `event_id` for organizer export.

**Parameters**
- `event_id` (int): event to export.

**Columns**
- `user_name`, `email`, `ticket_id`, `ticket_status`, `issued_at`, `checked_in_at`

**PostgreSQL**
```sql
SELECT
  u.name AS user_name,
  u.email,
  t.id AS ticket_id,
  t.status AS ticket_status,
  t.issued_at,
  t.checked_in_at
FROM tickets t
JOIN users u  ON u.id = t.user_id
JOIN events e ON e.id = t.event_id
WHERE t.event_id = $1
ORDER BY u.name, t.id;

