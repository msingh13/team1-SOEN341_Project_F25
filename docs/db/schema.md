### saves

Stores a student’s “saved” events (personal list).

| column     | type        | constraints                                   |
| ---------- | ----------- | --------------------------------------------- |
| user_id    | integer     | FK → users.id, part of PK, ON DELETE CASCADE  |
| event_id   | integer     | FK → events.id, part of PK, ON DELETE CASCADE |
| created_at | timestamptz | DEFAULT now()                                 |

**Primary Key:** (user_id, event_id)  
**Indexes:** ix_saves_user(user_id), ix_saves_event(event_id)  
**Notes:** Composite PK prevents duplicate saves for the same user/event.

### Tickets – QR Token & Check-in (Task-ORG-05-DB)

- `qr_token` has a **unique index**: `tickets_qr_token_key`, preventing duplicates and enabling O(log N) lookups for validation.
- `checked_in_at TIMESTAMP NULL` records the attendee check-in time.
- Migration 20251031:
  - Adds `checked_in_at` if missing (no-op if already present).
  - Skips creating a redundant non-unique index on `qr_token` when the unique index already exists.
- Rollback (DOWN) only drops helper index `ix_tickets_qr_token` **if it exists** (safe no-op otherwise).
