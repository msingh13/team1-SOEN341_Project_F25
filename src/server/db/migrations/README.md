# migrations/

This folder contains **SQL migration scripts** that define or update the database schema.

- Each file should represent one schema change (e.g., `create-users.sql`).
- Always run migrations in sequence to keep schema consistent.

✅ Example workflow:
1. Add a new migration file.
2. Apply it with:
   ```bash
   psql -d campus_events -f src/server/db/migrations/<filename>.sql
