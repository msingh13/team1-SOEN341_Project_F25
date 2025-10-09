 # Database Indexing & Seeds — US-STU-01 (Browse & Filter Events)

## Purpose
Improve filtering performance for `/events` by adding selective indexes and diverse seed data.

## Indexes Added
| Index | Description |
|-------|--------------|
| `idx_events_start_at` | Supports range queries and `ORDER BY start_at`. |
| `idx_events_category` | Speeds up `WHERE category = ?`. |
| `idx_events_org_id` | Speeds up `WHERE org_id = ?`. |
| `idx_events_published_start_at` | Partial index for `status='published'`; optimizes public browsing. |

## Verification
Run:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, start_at
FROM events
WHERE status='published'
  AND start_at BETWEEN now() AND now() + interval '30 days'
ORDER BY start_at
LIMIT 20;
```