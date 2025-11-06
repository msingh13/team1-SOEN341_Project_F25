-- 000_reset.sql  (run once)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Give basic privileges back (Postgres default)
GRANT ALL ON SCHEMA public TO public;
