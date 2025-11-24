-- OFF: offers accept flow

-- 1) offers table (one token per (user,event), unique token)
CREATE TABLE IF NOT EXISTS offers (
  id           SERIAL PRIMARY KEY,
  token        TEXT UNIQUE NOT NULL,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  event_id     INTEGER NOT NULL REFERENCES events(id),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  used_by_ticket_id INTEGER REFERENCES tickets(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_offer_per_user_event UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_offers_token ON offers(token);
CREATE INDEX IF NOT EXISTS idx_offers_event ON offers(event_id);
CREATE INDEX IF NOT EXISTS idx_offers_user ON offers(user_id);

-- 2) ensure events.capacity is NOT NULL and has a default
ALTER TABLE events
  ALTER COLUMN capacity SET NOT NULL,
  ALTER COLUMN capacity SET DEFAULT 0;

-- 3) helpful partial index for unused/valid offers
CREATE INDEX IF NOT EXISTS idx_offers_valid
  ON offers(event_id, expires_at)
  WHERE used_at IS NULL;
