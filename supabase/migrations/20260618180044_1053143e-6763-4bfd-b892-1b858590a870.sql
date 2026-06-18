
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_calendar_task_status_change() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Open read calendar_tasks"   ON public.calendar_tasks;
DROP POLICY IF EXISTS "Open insert calendar_tasks" ON public.calendar_tasks;
DROP POLICY IF EXISTS "Open update calendar_tasks" ON public.calendar_tasks;
DROP POLICY IF EXISTS "Open delete calendar_tasks" ON public.calendar_tasks;

CREATE POLICY "Read calendar_tasks with production"
  ON public.calendar_tasks FOR SELECT
  USING (production_id IS NOT NULL);

CREATE POLICY "Insert calendar_tasks with production"
  ON public.calendar_tasks FOR INSERT
  WITH CHECK (production_id IS NOT NULL);

CREATE POLICY "Update calendar_tasks with production"
  ON public.calendar_tasks FOR UPDATE
  USING (production_id IS NOT NULL)
  WITH CHECK (production_id IS NOT NULL);

CREATE POLICY "Delete calendar_tasks with production"
  ON public.calendar_tasks FOR DELETE
  USING (production_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert debug events" ON public.debug_events;
CREATE POLICY "Insert debug events with message"
  ON public.debug_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (message IS NOT NULL AND length(message) > 0);

DROP POLICY IF EXISTS "Anyone can insert sign-in events" ON public.sign_in_log;
CREATE POLICY "Insert sign-in events with type"
  ON public.sign_in_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (event_type IS NOT NULL AND length(event_type) > 0);
