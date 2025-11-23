-- Waitlist entries
CREATE TABLE IF NOT EXISTS event_waitlists (
  id              BIGSERIAL PRIMARY KEY,
  event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status          TEXT NOT NULL CHECK (
                    status IN ('queued','offered','accepted','expired','cancelled','declined')
                  ) DEFAULT 'queued',

  queue_position  INT NOT NULL,                      

  offer_token     TEXT UNIQUE,                       
  offer_expires_at TIMESTAMPTZ,                      

  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_evt_waitlist_event_user
ON event_waitlists(event_id, user_id)
WHERE status IN ('queued','offered','accepted');

CREATE INDEX IF NOT EXISTS ix_evt_waitlist_event_status
ON event_waitlists(event_id, status);

CREATE INDEX IF NOT EXISTS ix_evt_waitlist_offer_expires
ON event_waitlists(status, offer_expires_at);


--Per event waitlist settings
CREATE TABLE IF NOT EXISTS event_waitlist_settings (
  event_id             INT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  max_queue_length     INT CHECK (max_queue_length IS NULL OR max_queue_length >= 0),
  offer_window_minutes INT NOT NULL DEFAULT 60        -- how long an offer is valid
);


--Helper trigger
CREATE OR REPLACE FUNCTION touch_event_waitlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_waitlists_updated_at ON event_waitlists;

CREATE TRIGGER trg_event_waitlists_updated_at
BEFORE UPDATE ON event_waitlists
FOR EACH ROW
EXECUTE FUNCTION touch_event_waitlists_updated_at();
