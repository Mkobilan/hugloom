-- Comprehensive fix for care_circles RLS policies
-- This will completely reset and recreate all policies

-- 1. First, let's see what policies exist (run this in a separate query to check)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('care_circles', 'care_circle_members')
-- ORDER BY tablename, policyname;

-- 2. Drop ALL existing policies for care_circles
DROP POLICY IF EXISTS "Users can view circles they are members of" ON public.care_circles;
DROP POLICY IF EXISTS "Users can create circles" ON public.care_circles;
DROP POLICY IF EXISTS "Admins can update their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Admins can delete their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Circle creators can update" ON public.care_circles;
DROP POLICY IF EXISTS "Circle creators can delete" ON public.care_circles;
DROP POLICY IF EXISTS "Users can view their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Authenticated users can create circles" ON public.care_circles;

-- 3. Temporarily disable RLS to test
-- ALTER TABLE public.care_circles DISABLE ROW LEVEL SECURITY;

-- 4. OR create very permissive policies for testing
-- Re-enable RLS if disabled
ALTER TABLE public.care_circles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything (for testing)
CREATE POLICY "allow_all_authenticated_select" ON public.care_circles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_authenticated_insert" ON public.care_circles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_authenticated_update" ON public.care_circles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_all_authenticated_delete" ON public.care_circles
  FOR DELETE USING (auth.uid() IS NOT NULL);
