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


### organizations
| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PK | Organization ID |
| name | VARCHAR(120) | UNIQUE, NOT NULL | Organization name |
| description | TEXT |  | Optional text description |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

### user_org_roles
| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PK | Role entry ID |
| user_id | INTEGER | FK → users(id), ON DELETE CASCADE | Linked user |
| org_id | INTEGER | FK → organizations(id), ON DELETE CASCADE | Linked organization |
| role | VARCHAR(20) | CHECK (admin/organizer/member) | Role type |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| UNIQUE | (user_id, org_id, role) | Prevents duplicates |
