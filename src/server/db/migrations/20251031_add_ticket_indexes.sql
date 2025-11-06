-- 20251031_add_ticket_indexes.sql
-- Purpose: Ensure ticket QR token indexing and check-in tracking

-- 1. Add checked_in_at column if missing
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP NULL;

-- 2. Ensure unique index on qr_token for fast lookups and duplicate prevention
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'tickets_qr_token_key'
  ) THEN
    CREATE UNIQUE INDEX tickets_qr_token_key ON tickets(qr_token);
  END IF;
END $$;

