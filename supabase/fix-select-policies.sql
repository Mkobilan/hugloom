-- Fix RLS policies for care_circle_members to allow data access

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view circle membership" ON public.care_circle_members;
DROP POLICY IF EXISTS "Allow inserting circle members" ON public.care_circle_members;
DROP POLICY IF EXISTS "Circle creators can remove members" ON public.care_circle_members;

-- Create permissive policies for authenticated users
CREATE POLICY "allow_all_authenticated_select_members" ON public.care_circle_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_authenticated_insert_members" ON public.care_circle_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_authenticated_delete_members" ON public.care_circle_members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Also ensure medications and calendar_events allow SELECT for circle members
-- Drop any restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their medications" ON public.medications;
DROP POLICY IF EXISTS "Users can view their calendar events" ON public.calendar_events;

-- Create permissive SELECT policies
CREATE POLICY "allow_authenticated_select_medications" ON public.medications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_select_events" ON public.calendar_events
  FOR SELECT USING (auth.uid() IS NOT NULL);
