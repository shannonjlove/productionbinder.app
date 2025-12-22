-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'producer', 'coordinator', 'crew');

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  department TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'crew',
  UNIQUE (user_id, role)
);

-- Create productions table
CREATE TABLE public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_fax TEXT,
  director TEXT,
  producer TEXT,
  line_producer TEXT,
  start_date DATE,
  end_date DATE,
  total_days INTEGER DEFAULT 30,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cast_members table
CREATE TABLE public.cast_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE NOT NULL,
  cast_id INTEGER NOT NULL,
  character_name TEXT NOT NULL,
  actor_name TEXT,
  email TEXT,
  phone TEXT,
  agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crew_members table
CREATE TABLE public.crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rate DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scenes table (breakdown)
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE NOT NULL,
  scene_number TEXT NOT NULL,
  set_name TEXT,
  description TEXT,
  page_count TEXT,
  day_night TEXT,
  int_ext TEXT,
  location TEXT,
  props TEXT,
  wardrobe TEXT,
  makeup_hair TEXT,
  set_dressing TEXT,
  special_effects TEXT,
  stunts TEXT,
  vehicles TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scene_cast junction table
CREATE TABLE public.scene_cast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  cast_member_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(scene_id, cast_member_id)
);

-- Create shoot_days table
CREATE TABLE public.shoot_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  shoot_date DATE NOT NULL,
  location_name TEXT,
  location_address TEXT,
  nearest_hospital TEXT,
  hospital_address TEXT,
  crew_parking TEXT,
  base_camp TEXT,
  weather_high TEXT,
  weather_low TEXT,
  weather_conditions TEXT,
  sunrise TEXT,
  sunset TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call_sheets table
CREATE TABLE public.call_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shoot_day_id UUID REFERENCES public.shoot_days(id) ON DELETE CASCADE NOT NULL,
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE NOT NULL,
  general_crew_call TIME,
  shooting_call TIME,
  courtesy_breakfast TIME,
  lunch_time TIME,
  script_color TEXT,
  schedule_color TEXT,
  safety_notes TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call_sheet_scenes junction table
CREATE TABLE public.call_sheet_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE NOT NULL,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  scene_order INTEGER DEFAULT 0,
  notes TEXT
);

-- Create call_sheet_cast table (cast call times)
CREATE TABLE public.call_sheet_cast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE NOT NULL,
  cast_member_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
  status TEXT,
  pickup_time TIME,
  call_time TIME,
  block_rehearsal TIME,
  set_time TIME,
  special_instructions TEXT
);

-- Create call_sheet_crew table (crew call times)
CREATE TABLE public.call_sheet_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE NOT NULL,
  crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE CASCADE NOT NULL,
  call_time TIME,
  notes TEXT
);

-- Create day_out_of_days table for tracking cast across days
CREATE TABLE public.day_out_of_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE NOT NULL,
  cast_member_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
  shoot_day_id UUID REFERENCES public.shoot_days(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'W',
  UNIQUE(cast_member_id, shoot_day_id)
);

-- Create notification_log table
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_cast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoot_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_cast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_out_of_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'crew');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_productions_updated_at BEFORE UPDATE ON public.productions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cast_members_updated_at BEFORE UPDATE ON public.cast_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crew_members_updated_at BEFORE UPDATE ON public.crew_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON public.scenes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shoot_days_updated_at BEFORE UPDATE ON public.shoot_days FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_call_sheets_updated_at BEFORE UPDATE ON public.call_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (only admins can modify, users can view their own)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for productions (authenticated users can access)
CREATE POLICY "Authenticated users can view productions" ON public.productions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create productions" ON public.productions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Producers and admins can update productions" ON public.productions FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'producer'));
CREATE POLICY "Producers and admins can delete productions" ON public.productions FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cast_members
CREATE POLICY "Authenticated users can view cast" ON public.cast_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create cast" ON public.cast_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cast" ON public.cast_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cast" ON public.cast_members FOR DELETE TO authenticated USING (true);

-- RLS Policies for crew_members
CREATE POLICY "Authenticated users can view crew" ON public.crew_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create crew" ON public.crew_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update crew" ON public.crew_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete crew" ON public.crew_members FOR DELETE TO authenticated USING (true);

-- RLS Policies for scenes
CREATE POLICY "Authenticated users can view scenes" ON public.scenes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create scenes" ON public.scenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update scenes" ON public.scenes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete scenes" ON public.scenes FOR DELETE TO authenticated USING (true);

-- RLS Policies for scene_cast
CREATE POLICY "Authenticated users can view scene_cast" ON public.scene_cast FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage scene_cast" ON public.scene_cast FOR ALL TO authenticated USING (true);

-- RLS Policies for shoot_days
CREATE POLICY "Authenticated users can view shoot_days" ON public.shoot_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create shoot_days" ON public.shoot_days FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update shoot_days" ON public.shoot_days FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete shoot_days" ON public.shoot_days FOR DELETE TO authenticated USING (true);

-- RLS Policies for call_sheets
CREATE POLICY "Authenticated users can view call_sheets" ON public.call_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create call_sheets" ON public.call_sheets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update call_sheets" ON public.call_sheets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete call_sheets" ON public.call_sheets FOR DELETE TO authenticated USING (true);

-- RLS Policies for call_sheet_scenes
CREATE POLICY "Authenticated users can manage call_sheet_scenes" ON public.call_sheet_scenes FOR ALL TO authenticated USING (true);

-- RLS Policies for call_sheet_cast
CREATE POLICY "Authenticated users can manage call_sheet_cast" ON public.call_sheet_cast FOR ALL TO authenticated USING (true);

-- RLS Policies for call_sheet_crew
CREATE POLICY "Authenticated users can manage call_sheet_crew" ON public.call_sheet_crew FOR ALL TO authenticated USING (true);

-- RLS Policies for day_out_of_days
CREATE POLICY "Authenticated users can manage dood" ON public.day_out_of_days FOR ALL TO authenticated USING (true);

-- RLS Policies for notification_log
CREATE POLICY "Authenticated users can view notifications" ON public.notification_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create notifications" ON public.notification_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications" ON public.notification_log FOR UPDATE TO authenticated USING (true);