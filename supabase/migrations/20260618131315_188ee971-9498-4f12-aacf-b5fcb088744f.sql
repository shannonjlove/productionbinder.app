
ALTER TABLE public.calendar_tasks
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_until date,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES public.calendar_tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reminder_minutes_before integer,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.calendar_task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.calendar_tasks(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by_name text,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_task_history TO anon, authenticated;
GRANT ALL ON public.calendar_task_history TO service_role;

ALTER TABLE public.calendar_task_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read calendar_task_history" ON public.calendar_task_history;
DROP POLICY IF EXISTS "Open insert calendar_task_history" ON public.calendar_task_history;
DROP POLICY IF EXISTS "Open update calendar_task_history" ON public.calendar_task_history;
DROP POLICY IF EXISTS "Open delete calendar_task_history" ON public.calendar_task_history;
CREATE POLICY "Open read calendar_task_history" ON public.calendar_task_history FOR SELECT USING (true);
CREATE POLICY "Open insert calendar_task_history" ON public.calendar_task_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Open update calendar_task_history" ON public.calendar_task_history FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Open delete calendar_task_history" ON public.calendar_task_history FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_calendar_task_history_task ON public.calendar_task_history(task_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.log_calendar_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.calendar_task_history(task_id, from_status, to_status, note)
    VALUES (NEW.id, NULL, NEW.status, 'Task created');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.calendar_task_history(task_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calendar_task_status_history ON public.calendar_tasks;
CREATE TRIGGER trg_calendar_task_status_history
AFTER INSERT OR UPDATE OF status ON public.calendar_tasks
FOR EACH ROW EXECUTE FUNCTION public.log_calendar_task_status_change();
