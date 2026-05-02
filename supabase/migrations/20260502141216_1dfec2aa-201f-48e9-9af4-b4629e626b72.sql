
-- =========================================
-- Helper: production membership check
-- =========================================
CREATE OR REPLACE FUNCTION public.is_production_member(_user_id uuid, _production_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.productions p
    WHERE p.id = _production_id
      AND (
        p.created_by = _user_id
        OR public.has_role(_user_id, 'admin'::app_role)
        OR public.has_role(_user_id, 'producer'::app_role)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_production_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_production_member(uuid, uuid) TO authenticated;

-- has_role hardening
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- =========================================
-- PRODUCTIONS: restrict SELECT to creator/admin/producer
-- =========================================
DROP POLICY IF EXISTS "Authenticated users can view productions" ON public.productions;
CREATE POLICY "Members can view productions"
ON public.productions FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'producer'::app_role)
);

-- =========================================
-- PROFILES: restrict SELECT to owner + admins
-- =========================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- AV_SCRIPTS / AV_SCRIPT_ENTRIES: restrict to authenticated + production members
-- =========================================
DROP POLICY IF EXISTS "Authenticated users can view av_scripts" ON public.av_scripts;
DROP POLICY IF EXISTS "Authenticated users can create av_scripts" ON public.av_scripts;
DROP POLICY IF EXISTS "Authenticated users can update av_scripts" ON public.av_scripts;
DROP POLICY IF EXISTS "Authenticated users can delete av_scripts" ON public.av_scripts;

CREATE POLICY "Members can view av_scripts" ON public.av_scripts FOR SELECT TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can insert av_scripts" ON public.av_scripts FOR INSERT TO authenticated
WITH CHECK (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can update av_scripts" ON public.av_scripts FOR UPDATE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can delete av_scripts" ON public.av_scripts FOR DELETE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));

DROP POLICY IF EXISTS "Authenticated users can view av_script_entries" ON public.av_script_entries;
DROP POLICY IF EXISTS "Authenticated users can create av_script_entries" ON public.av_script_entries;
DROP POLICY IF EXISTS "Authenticated users can update av_script_entries" ON public.av_script_entries;
DROP POLICY IF EXISTS "Authenticated users can delete av_script_entries" ON public.av_script_entries;

CREATE POLICY "Members can view av_script_entries" ON public.av_script_entries FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = script_id AND public.is_production_member(auth.uid(), s.production_id)));
CREATE POLICY "Members can insert av_script_entries" ON public.av_script_entries FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = script_id AND public.is_production_member(auth.uid(), s.production_id)));
CREATE POLICY "Members can update av_script_entries" ON public.av_script_entries FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = script_id AND public.is_production_member(auth.uid(), s.production_id)));
CREATE POLICY "Members can delete av_script_entries" ON public.av_script_entries FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = script_id AND public.is_production_member(auth.uid(), s.production_id)));

-- =========================================
-- CAST_MEMBERS: scope to production members
-- =========================================
DROP POLICY IF EXISTS "Authenticated users can view cast" ON public.cast_members;
DROP POLICY IF EXISTS "Authenticated users can create cast" ON public.cast_members;
DROP POLICY IF EXISTS "Authenticated users can update cast" ON public.cast_members;
DROP POLICY IF EXISTS "Authenticated users can delete cast" ON public.cast_members;

CREATE POLICY "Members can view cast" ON public.cast_members FOR SELECT TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can insert cast" ON public.cast_members FOR INSERT TO authenticated
WITH CHECK (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can update cast" ON public.cast_members FOR UPDATE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can delete cast" ON public.cast_members FOR DELETE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));

-- =========================================
-- CREW_MEMBERS: scope to production members
-- =========================================
DROP POLICY IF EXISTS "Authenticated users can view crew" ON public.crew_members;
DROP POLICY IF EXISTS "Authenticated users can create crew" ON public.crew_members;
DROP POLICY IF EXISTS "Authenticated users can update crew" ON public.crew_members;
DROP POLICY IF EXISTS "Authenticated users can delete crew" ON public.crew_members;

CREATE POLICY "Members can view crew" ON public.crew_members FOR SELECT TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can insert crew" ON public.crew_members FOR INSERT TO authenticated
WITH CHECK (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can update crew" ON public.crew_members FOR UPDATE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can delete crew" ON public.crew_members FOR DELETE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));

-- =========================================
-- SCENES, SHOOT_DAYS: scope to production members
-- =========================================
DROP POLICY IF EXISTS "Authenticated users can view scenes" ON public.scenes;
DROP POLICY IF EXISTS "Authenticated users can create scenes" ON public.scenes;
DROP POLICY IF EXISTS "Authenticated users can update scenes" ON public.scenes;
DROP POLICY IF EXISTS "Authenticated users can delete scenes" ON public.scenes;

CREATE POLICY "Members can view scenes" ON public.scenes FOR SELECT TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can insert scenes" ON public.scenes FOR INSERT TO authenticated
WITH CHECK (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can update scenes" ON public.scenes FOR UPDATE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can delete scenes" ON public.scenes FOR DELETE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));

DROP POLICY IF EXISTS "Authenticated users can view shoot_days" ON public.shoot_days;
DROP POLICY IF EXISTS "Authenticated users can create shoot_days" ON public.shoot_days;
DROP POLICY IF EXISTS "Authenticated users can update shoot_days" ON public.shoot_days;
DROP POLICY IF EXISTS "Authenticated users can delete shoot_days" ON public.shoot_days;

CREATE POLICY "Members can view shoot_days" ON public.shoot_days FOR SELECT TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can insert shoot_days" ON public.shoot_days FOR INSERT TO authenticated
WITH CHECK (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can update shoot_days" ON public.shoot_days FOR UPDATE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can delete shoot_days" ON public.shoot_days FOR DELETE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));

-- =========================================
-- CALL_SHEETS and dependents: scope via production_id
-- =========================================
DROP POLICY IF EXISTS "Authenticated users can view call_sheets" ON public.call_sheets;
DROP POLICY IF EXISTS "Authenticated users can create call_sheets" ON public.call_sheets;
DROP POLICY IF EXISTS "Authenticated users can update call_sheets" ON public.call_sheets;
DROP POLICY IF EXISTS "Authenticated users can delete call_sheets" ON public.call_sheets;

CREATE POLICY "Members can view call_sheets" ON public.call_sheets FOR SELECT TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can insert call_sheets" ON public.call_sheets FOR INSERT TO authenticated
WITH CHECK (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can update call_sheets" ON public.call_sheets FOR UPDATE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));
CREATE POLICY "Members can delete call_sheets" ON public.call_sheets FOR DELETE TO authenticated
USING (public.is_production_member(auth.uid(), production_id));

-- call_sheet_cast / call_sheet_crew / call_sheet_scenes / scene_cast / day_out_of_days / crew_check_ins / notification_log
-- Drop overly permissive policies and rebuild scoped policies
DROP POLICY IF EXISTS "Authenticated users can manage call_sheet_cast" ON public.call_sheet_cast;
CREATE POLICY "Members can manage call_sheet_cast" ON public.call_sheet_cast FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));

DROP POLICY IF EXISTS "Authenticated users can manage call_sheet_crew" ON public.call_sheet_crew;
CREATE POLICY "Members can manage call_sheet_crew" ON public.call_sheet_crew FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));

DROP POLICY IF EXISTS "Authenticated users can manage call_sheet_scenes" ON public.call_sheet_scenes;
CREATE POLICY "Members can manage call_sheet_scenes" ON public.call_sheet_scenes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));

DROP POLICY IF EXISTS "Authenticated users can view scene_cast" ON public.scene_cast;
DROP POLICY IF EXISTS "Authenticated users can manage scene_cast" ON public.scene_cast;
CREATE POLICY "Members can manage scene_cast" ON public.scene_cast FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.scenes s WHERE s.id = scene_id AND public.is_production_member(auth.uid(), s.production_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.scenes s WHERE s.id = scene_id AND public.is_production_member(auth.uid(), s.production_id)));

DROP POLICY IF EXISTS "Authenticated users can manage dood" ON public.day_out_of_days;
CREATE POLICY "Members can manage dood" ON public.day_out_of_days FOR ALL TO authenticated
USING (public.is_production_member(auth.uid(), production_id))
WITH CHECK (public.is_production_member(auth.uid(), production_id));

-- crew_check_ins
DROP POLICY IF EXISTS "Users can view check-ins" ON public.crew_check_ins;
DROP POLICY IF EXISTS "Users can check in" ON public.crew_check_ins;
DROP POLICY IF EXISTS "Users can update check-ins" ON public.crew_check_ins;

CREATE POLICY "Members can view check-ins" ON public.crew_check_ins FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));
CREATE POLICY "Members can insert check-ins" ON public.crew_check_ins FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));
CREATE POLICY "Members can update check-ins" ON public.crew_check_ins FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));

-- notification_log
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notification_log;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notification_log;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notification_log;

CREATE POLICY "Members can view notifications" ON public.notification_log FOR SELECT TO authenticated
USING (call_sheet_id IS NULL OR EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));
CREATE POLICY "Members can insert notifications" ON public.notification_log FOR INSERT TO authenticated
WITH CHECK (call_sheet_id IS NULL OR EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));
CREATE POLICY "Members can update notifications" ON public.notification_log FOR UPDATE TO authenticated
USING (call_sheet_id IS NULL OR EXISTS (SELECT 1 FROM public.call_sheets cs WHERE cs.id = call_sheet_id AND public.is_production_member(auth.uid(), cs.production_id)));
