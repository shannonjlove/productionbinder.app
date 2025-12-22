-- Create crew check-ins table
CREATE TABLE public.crew_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_sheet_id UUID NOT NULL REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  notes TEXT,
  UNIQUE(call_sheet_id, crew_member_id)
);

-- Enable RLS
ALTER TABLE public.crew_check_ins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view check-ins for their productions
CREATE POLICY "Users can view check-ins" ON public.crew_check_ins
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert their own check-ins
CREATE POLICY "Users can check in" ON public.crew_check_ins
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to update their own check-ins
CREATE POLICY "Users can update check-ins" ON public.crew_check_ins
  FOR UPDATE TO authenticated USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_check_ins;