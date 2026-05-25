
CREATE TABLE IF NOT EXISTS public.series_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  site_url text,
  description text,
  lovable_project_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.series_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read series_projects" ON public.series_projects
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage series_projects" ON public.series_projects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_series_projects_updated
  BEFORE UPDATE ON public.series_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.series_projects (slug, name, site_url, description, lovable_project_id) VALUES
  ('crockett', 'Crockett Compass — crockettscience.org', 'https://crockettscience-org.lovable.app',
   'Internal knowledge base and admin coordination for the crockettscience.org web series project.',
   'c2e82059-1803-4187-8e99-8700258787cf')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.compass_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series_projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text,
  external_url text,
  tags text[] DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compass_entries_series ON public.compass_entries(series_id);
ALTER TABLE public.compass_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read compass_entries" ON public.compass_entries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage compass_entries" ON public.compass_entries
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_compass_entries_updated
  BEFORE UPDATE ON public.compass_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a few starter Compass entries
INSERT INTO public.compass_entries (series_id, category, title, body, external_url, pinned)
SELECT sp.id, 'workflow', 'Production workflow overview',
       'ProductionBinder hosts call sheets, scenes, crew, and DOOD for the Crockett series. Compass keeps the editorial, web, and admin notes.', 'https://crockettscience-org.lovable.app', true
FROM public.series_projects sp WHERE sp.slug = 'crockett'
UNION ALL
SELECT sp.id, 'admin', 'Admin contacts',
       'Auto-admins: shannonjlove@mac.com, sjlove@shannonjeffreylove.com, earlcox@gmail.com', null, true
FROM public.series_projects sp WHERE sp.slug = 'crockett'
UNION ALL
SELECT sp.id, 'web', 'Public site',
       'crockettscience.org marketing/presentation site (Lovable project).', 'https://crockettscience-org.lovable.app', false
FROM public.series_projects sp WHERE sp.slug = 'crockett';
