
-- 1) notification_log: remove NULL-branch access and require call_sheet_id
DELETE FROM public.notification_log WHERE call_sheet_id IS NULL;

ALTER TABLE public.notification_log
  ALTER COLUMN call_sheet_id SET NOT NULL;

DROP POLICY IF EXISTS "Members can view notifications" ON public.notification_log;
DROP POLICY IF EXISTS "Members can insert notifications" ON public.notification_log;
DROP POLICY IF EXISTS "Members can update notifications" ON public.notification_log;

CREATE POLICY "Members can view notifications"
ON public.notification_log FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.call_sheets cs
  WHERE cs.id = notification_log.call_sheet_id
    AND public.is_production_member(auth.uid(), cs.production_id)
));

CREATE POLICY "Members can insert notifications"
ON public.notification_log FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.call_sheets cs
  WHERE cs.id = notification_log.call_sheet_id
    AND public.is_production_member(auth.uid(), cs.production_id)
));

CREATE POLICY "Members can update notifications"
ON public.notification_log FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.call_sheets cs
  WHERE cs.id = notification_log.call_sheet_id
    AND public.is_production_member(auth.uid(), cs.production_id)
));

-- 2) Tighten is_production_member: drop global 'producer' role bypass.
-- Only the production creator or a global admin is a member.
CREATE OR REPLACE FUNCTION public.is_production_member(_user_id uuid, _production_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.productions p
    WHERE p.id = _production_id
      AND (
        p.created_by = _user_id
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  );
$$;
