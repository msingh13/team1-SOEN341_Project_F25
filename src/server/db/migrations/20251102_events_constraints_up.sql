ALTER TABLE public.events
      DROP CONSTRAINT IF EXISTS events_capacity_check,
      ADD CONSTRAINT events_capacity_check CHECK (capacity > 0);

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft','submitted','published','rejected'));
ALTER TABLE public.events
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.events
  ADD CONSTRAINT events_time_range_chk
  CHECK (end_at >= start_at);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS ix_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS ix_events_org_status ON public.events(org_id, status);