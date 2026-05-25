
-- Auto-admin allowlist: emails in this table become admin on signup
CREATE TABLE IF NOT EXISTS public.auto_admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auto_admin_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read auto_admin_emails" ON public.auto_admin_emails
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage auto_admin_emails" ON public.auto_admin_emails
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the three admin emails
INSERT INTO public.auto_admin_emails (email) VALUES
  ('shannonjlove@mac.com'),
  ('sjlove@shannonjeffreylove.com'),
  ('earlcox@gmail.com')
ON CONFLICT DO NOTHING;

-- Grant admin role to any existing users in that list
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
JOIN public.auto_admin_emails a ON lower(a.email) = lower(p.email)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update handle_new_user to grant admin to allowlisted emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);

  IF EXISTS (SELECT 1 FROM public.auto_admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'crew')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Domain/DNS records reference table (admin-managed knowledge base)
CREATE TABLE IF NOT EXISTS public.domain_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  record_type text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.domain_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read domain_records" ON public.domain_records
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage domain_records" ON public.domain_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_domain_records_updated
  BEFORE UPDATE ON public.domain_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed current productionbinder.app DNS state
INSERT INTO public.domain_records (domain, record_type, name, value, notes) VALUES
  ('productionbinder.app','A','@','185.158.133.1','Lovable apex (DNS-only / not proxied)'),
  ('productionbinder.app','A','www','185.158.133.1','Lovable www (DNS-only / not proxied)'),
  ('productionbinder.app','TXT','_lovable','lovable_verify=<your-token>','Domain ownership verification'),
  ('notify.productionbinder.app','NS','notify','ns3.lovable.cloud','Email subdomain delegation (Lovable Emails)'),
  ('notify.productionbinder.app','NS','notify','ns4.lovable.cloud','Email subdomain delegation (Lovable Emails)');
