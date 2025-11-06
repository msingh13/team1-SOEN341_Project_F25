-- DOWN: Task-ORG-05-DB (QR token index + check-in column)
-- This rollback removes only the helper non-unique index we added.
-- We intentionally do NOT drop:
--   - the unique index/constraint on qr_token (tickets_qr_token_key),
--   - the checked_in_at column,
-- because those existed in your schema already in this environment.

DROP INDEX IF EXISTS ix_tickets_qr_token;