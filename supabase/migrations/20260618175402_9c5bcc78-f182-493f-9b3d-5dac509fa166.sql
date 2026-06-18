-- 1) Remove audit_log from realtime publication (RLS-bypass exposure)
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_log;

-- 2) Lock down calendar_task_history
DROP POLICY IF EXISTS "Open read calendar_task_history" ON public.calendar_task_history;
DROP POLICY IF EXISTS "Open insert calendar_task_history" ON public.calendar_task_history;
DROP POLICY IF EXISTS "Open update calendar_task_history" ON public.calendar_task_history;
DROP POLICY IF EXISTS "Open delete calendar_task_history" ON public.calendar_task_history;

REVOKE ALL ON public.calendar_task_history FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_task_history TO authenticated;
GRANT ALL ON public.calendar_task_history TO service_role;

CREATE POLICY "Members can view task history"
  ON public.calendar_task_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_tasks t
      WHERE t.id = calendar_task_history.task_id
        AND public.is_production_member(auth.uid(), t.production_id)
    )
  );

CREATE POLICY "Members can insert task history"
  ON public.calendar_task_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_tasks t
      WHERE t.id = calendar_task_history.task_id
        AND public.is_production_member(auth.uid(), t.production_id)
    )
  );

CREATE POLICY "Members can update task history"
  ON public.calendar_task_history FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_tasks t
      WHERE t.id = calendar_task_history.task_id
        AND public.is_production_member(auth.uid(), t.production_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_tasks t
      WHERE t.id = calendar_task_history.task_id
        AND public.is_production_member(auth.uid(), t.production_id)
    )
  );

CREATE POLICY "Members can delete task history"
  ON public.calendar_task_history FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_tasks t
      WHERE t.id = calendar_task_history.task_id
        AND public.is_production_member(auth.uid(), t.production_id)
    )
  );