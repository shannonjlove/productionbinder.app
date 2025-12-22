-- Create av_scripts table for A/V script builder
CREATE TABLE public.av_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Script',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create av_script_entries table for individual rows
CREATE TABLE public.av_script_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.av_scripts(id) ON DELETE CASCADE,
  segment TEXT,
  visual TEXT,
  audio TEXT,
  duration TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.av_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.av_script_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for av_scripts
CREATE POLICY "Authenticated users can view av_scripts"
ON public.av_scripts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create av_scripts"
ON public.av_scripts FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update av_scripts"
ON public.av_scripts FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete av_scripts"
ON public.av_scripts FOR DELETE USING (true);

-- RLS policies for av_script_entries
CREATE POLICY "Authenticated users can view av_script_entries"
ON public.av_script_entries FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create av_script_entries"
ON public.av_script_entries FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update av_script_entries"
ON public.av_script_entries FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete av_script_entries"
ON public.av_script_entries FOR DELETE USING (true);

-- Create update trigger for timestamps
CREATE TRIGGER update_av_scripts_updated_at
BEFORE UPDATE ON public.av_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_av_script_entries_updated_at
BEFORE UPDATE ON public.av_script_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();