# Event Indexing Notes (US-STU-01)

**Goal:**  
Improve performance of `/events` browsing and filtering queries.

---

### Indexes Added
| Index | Purpose |
|--------|----------|
| `events(start_at)` | Speeds up time-based browsing and sorting |
| `events(category)` | Optimizes category filter |
| `events(org_id)` | Optimizes organization filter |
| `events(start_at) WHERE status='published'` | Partial index for public event listings |

---

### Seeds
- File: `db/seeds/events_seed.sql`
- Inserts several sample events across multiple categories and orgs.
- Run after migrations to test filtering queries.

---

### Verify Index Usage
Run this query:
```sql
EXPLAIN ANALYZE
SELECT * FROM events
WHERE status='published' AND category='tech' AND start_at >= NOW()
ORDER BY start_at
LIMIT 10;
```
