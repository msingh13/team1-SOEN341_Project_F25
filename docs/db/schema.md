### saves

Stores a student’s “saved” events (personal list).

| column     | type        | constraints                                  |
|------------|-------------|-----------------------------------------------|
| user_id    | integer     | FK → users.id, part of PK, ON DELETE CASCADE |
| event_id   | integer     | FK → events.id, part of PK, ON DELETE CASCADE|
| created_at | timestamptz | DEFAULT now()                                 |

**Primary Key:** (user_id, event_id)  
**Indexes:** ix_saves_user(user_id), ix_saves_event(event_id)  
**Notes:** Composite PK prevents duplicate saves for the same user/event.
