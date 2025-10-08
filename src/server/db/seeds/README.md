# seeds/

This folder contains **seed data** for populating the database with sample/demo records.

- Useful for local development and testing.
- Should insert users, organizations, and events so the frontend can display real data.
- Should be idempotent (safe to run multiple times).

✅ Example workflow:
1. Create a seed file (e.g., `demo_events.sql`).
2. Run it:
   ```bash
   psql -d campus_events -f src/server/db/seeds/<filename>.sql```
   