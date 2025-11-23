CREATE OR REPLACE FUNCTION enforce_event_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('published','rejected') AND OLD.status <> 'submitted' THEN
      RAISE EXCEPTION
        'Invalid transition: % -> % (must come from submitted)',
        OLD.status, NEW.status
        USING ERRCODE = 'check_violation',
              CONSTRAINT = 'events_status_transition_rule';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_status_rule ON public.events;
CREATE TRIGGER trg_events_status_rule
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION enforce_event_status_transition();


CREATE TABLE IF NOT EXISTS public.event_moderation_log (
  id         BIGSERIAL PRIMARY KEY,
  event_id   BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  admin_id   BIGINT     REFERENCES public.users(id) ON DELETE SET NULL,
  action     VARCHAR(10) NOT NULL CHECK (action IN ('publish','reject')),
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_eml_event      ON public.event_moderation_log (event_id);
CREATE INDEX IF NOT EXISTS ix_eml_created_at ON public.event_moderation_log (created_at);

COMMENT ON TABLE  public.event_moderation_log IS 'Audit trail of publish/reject actions by admins';
COMMENT ON COLUMN public.event_moderation_log.admin_id IS 'Admin user performing moderation';

CREATE OR REPLACE FUNCTION log_event_moderation()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id BIGINT;
  v_reason   TEXT;
  v_action   TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('published','rejected') THEN

    v_admin_id := NULLIF(current_setting('app.admin_id', true), '')::BIGINT;
    v_reason   := NULLIF(current_setting('app.moderation_reason', true), '');
    v_action   := CASE NEW.status WHEN 'published' THEN 'publish' ELSE 'reject' END;

    INSERT INTO public.event_moderation_log(event_id, admin_id, action, reason)
    VALUES (NEW.id, v_admin_id, v_action, v_reason);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_moderation_log ON public.events;
CREATE TRIGGER trg_events_moderation_log
AFTER UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION log_event_moderation();