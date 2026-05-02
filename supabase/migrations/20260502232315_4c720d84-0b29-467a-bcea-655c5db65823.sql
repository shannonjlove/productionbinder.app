
CREATE TABLE public.av_script_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL,
  version_number integer NOT NULL,
  label text,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (script_id, version_number)
);

CREATE INDEX idx_av_script_versions_script ON public.av_script_versions(script_id, version_number DESC);

ALTER TABLE public.av_script_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view av_script_versions"
ON public.av_script_versions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = av_script_versions.script_id AND public.is_production_member(auth.uid(), s.production_id)));

CREATE POLICY "Members can insert av_script_versions"
ON public.av_script_versions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = av_script_versions.script_id AND public.is_production_member(auth.uid(), s.production_id)));

CREATE POLICY "Members can delete av_script_versions"
ON public.av_script_versions FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.av_scripts s WHERE s.id = av_script_versions.script_id AND public.is_production_member(auth.uid(), s.production_id)));
