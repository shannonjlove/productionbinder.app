-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_record_id uuid;
BEGIN
  BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_email := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_record_id := (to_jsonb(OLD)->>'id')::uuid;
    INSERT INTO public.audit_log(user_id, user_email, action, table_name, record_id, old_data)
    VALUES (v_user_id, v_email, TG_OP, TG_TABLE_NAME, v_record_id, to_jsonb(OLD));
    RETURN OLD;
  ELSE
    v_record_id := (to_jsonb(NEW)->>'id')::uuid;
    INSERT INTO public.audit_log(user_id, user_email, action, table_name, record_id, old_data, new_data)
    VALUES (v_user_id, v_email, TG_OP, TG_TABLE_NAME, v_record_id,
            CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
            to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

-- Attach triggers to key tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['productions','user_roles','call_sheets','scenes','crew_members','cast_members','shoot_days']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();', t, t);
  END LOOP;
END $$;