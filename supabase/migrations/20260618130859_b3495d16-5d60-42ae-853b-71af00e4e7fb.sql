
CREATE TABLE public.calendar_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  scheduled_date date NOT NULL,
  start_time time,
  end_time time,
  duration_minutes integer,
  location text,
  owner_name text,
  manager_name text,
  worker_name text,
  backup_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_tasks TO anon, authenticated;
GRANT ALL ON public.calendar_tasks TO service_role;

ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open read calendar_tasks" ON public.calendar_tasks FOR SELECT USING (true);
CREATE POLICY "Open insert calendar_tasks" ON public.calendar_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Open update calendar_tasks" ON public.calendar_tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Open delete calendar_tasks" ON public.calendar_tasks FOR DELETE USING (true);

CREATE INDEX idx_calendar_tasks_production_date ON public.calendar_tasks(production_id, scheduled_date);

CREATE TRIGGER update_calendar_tasks_updated_at
  BEFORE UPDATE ON public.calendar_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
