DROP TRIGGER IF EXISTS trg_events_moderation_log ON public.events;
DROP FUNCTION IF EXISTS log_event_moderation();

DROP TRIGGER IF EXISTS trg_events_status_rule ON public.events;
DROP FUNCTION IF EXISTS enforce_event_status_transition();

DROP TABLE IF EXISTS public.event_moderation_log;