DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
DROP FUNCTION IF EXISTS set_updated_at_timestamp();

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_time_range_chk;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_capacity_check,
  ADD  CONSTRAINT events_capacity_check CHECK (capacity >= 0);

ALTER TABLE public.events
  ALTER COLUMN status SET DEFAULT 'published';
