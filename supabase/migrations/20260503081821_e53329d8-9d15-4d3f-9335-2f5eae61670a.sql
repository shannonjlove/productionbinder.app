
-- Sign-in log table
CREATE TABLE public.sign_in_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event_type text NOT NULL, -- 'sign_in', 'sign_out', 'sign_in_failed', 'password_reset_request', 'password_reset_complete'
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sign_in_log_created_at ON public.sign_in_log (created_at DESC);
CREATE INDEX idx_sign_in_log_email ON public.sign_in_log (email);

ALTER TABLE public.sign_in_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sign-in events"
  ON public.sign_in_log FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view sign-in log"
  ON public.sign_in_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Debug events table for site-level timestamp debugging
CREATE TABLE public.debug_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info', -- 'info', 'warn', 'error', 'debug'
  source text, -- e.g. 'client', 'server', 'edge:function-name', component name
  message text NOT NULL,
  context jsonb,
  user_id uuid,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_debug_events_created_at ON public.debug_events (created_at DESC);
CREATE INDEX idx_debug_events_level ON public.debug_events (level);

ALTER TABLE public.debug_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert debug events"
  ON public.debug_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view debug events"
  ON public.debug_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete debug events"
  ON public.debug_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
