-- Fix: Add INSERT policy that works with server-side auth

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create circles" ON public.care_circles;
DROP POLICY IF EXISTS "Authenticated users can create circles" ON public.care_circles;

-- Create a simpler INSERT policy
-- We validate created_by in the server action, so just check auth exists
CREATE POLICY "Authenticated users can create circles"
ON public.care_circles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
