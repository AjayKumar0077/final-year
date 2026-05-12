-- Create roles enum type
CREATE TYPE public.user_role AS ENUM ('donor', 'reporter', 'ngo', 'volunteer');

-- Extend auth.users with public profile info
-- This table mirrors the auth.users table but stores additional profile data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  organization TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow profiles to be read for dashboard purposes (reporters, ngos, volunteers need to see donor names, etc)
CREATE POLICY "Allow public read access to user profiles" 
  ON public.users 
  FOR SELECT 
  USING (true);

-- Create donation tracking table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view their own donations" 
  ON public.donations 
  FOR SELECT 
  USING (auth.uid() = donor_id OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ngo'));

CREATE POLICY "Donors can create donations" 
  ON public.donations 
  FOR INSERT 
  WITH CHECK (auth.uid() = donor_id);

-- Create case reports table for reporters
CREATE TABLE IF NOT EXISTS public.case_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  status TEXT DEFAULT 'unverified',
  urgency_score FLOAT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.case_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow reporters to view their own cases" 
  ON public.case_reports 
  FOR SELECT 
  USING (auth.uid() = reporter_id OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ngo', 'volunteer')));

CREATE POLICY "Allow reporters to create cases" 
  ON public.case_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);

-- Create missions table
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_report_id UUID REFERENCES public.case_reports(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pickup_location TEXT,
  delivery_location TEXT,
  assigned_volunteer_id UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow volunteers to view assigned missions" 
  ON public.missions 
  FOR SELECT 
  USING (auth.uid() = assigned_volunteer_id OR 
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ngo'));

CREATE POLICY "Allow ngos to create and update missions" 
  ON public.missions 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ngo'));
