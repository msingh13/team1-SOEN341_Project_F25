-- Returns attendee details for a single event.
-- Parameter: $1 = event_id (integer)

SELECT
  u.name        AS user_name,
  u.email       AS email,
  t.id          AS ticket_id,
  t.status      AS ticket_status,
  t.issued_at   AS issued_at,
  t.checked_in_at AS checked_in_at
FROM tickets AS t
JOIN users   AS u ON u.id = t.user_id
JOIN events  AS e ON e.id = t.event_id
WHERE t.event_id = $1
ORDER BY u.name, t.id;
