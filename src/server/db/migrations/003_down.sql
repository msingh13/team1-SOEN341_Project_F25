-- Rollback: 003_create_organizations_and_roles_down.sql
BEGIN;
DROP TABLE IF EXISTS user_org_roles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
COMMIT;
