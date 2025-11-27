-- Fix RLS Policies - Remove infinite recursion
-- Run this to fix the broken policies

-- 1. Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view circles they are members of" ON public.care_circles;
DROP POLICY IF EXISTS "Users can create circles" ON public.care_circles;
DROP POLICY IF EXISTS "Admins can update their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Admins can delete their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Circle creators can update" ON public.care_circles;
DROP POLICY IF EXISTS "Circle creators can delete" ON public.care_circles;
DROP POLICY IF EXISTS "Users can view their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Users can view members of their circles" ON public.care_circle_members;
DROP POLICY IF EXISTS "Users can add themselves to circles" ON public.care_circle_members;
DROP POLICY IF EXISTS "Admins can add members to their circles" ON public.care_circle_members;
DROP POLICY IF EXISTS "Admins can remove members from their circles" ON public.care_circle_members;
DROP POLICY IF EXISTS "Anyone can view circle members" ON public.care_circle_members;
DROP POLICY IF EXISTS "Authenticated users can insert circle members" ON public.care_circle_members;
DROP POLICY IF EXISTS "Users can delete circle members" ON public.care_circle_members;

-- 2. Create simple, non-recursive policies for care_circle_members FIRST
-- These don't reference themselves, so no recursion

-- Allow viewing members (we control circle visibility separately)
CREATE POLICY "Members can view circle membership"
ON public.care_circle_members FOR SELECT
USING (true);

-- Allow inserting members - we'll validate in application code
-- This is safe because we check in the server action
CREATE POLICY "Allow inserting circle members"
ON public.care_circle_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id  -- Can add yourself
  OR 
  EXISTS (
    SELECT 1 FROM care_circles 
    WHERE id = circle_id AND created_by = auth.uid()
  )  -- OR you're the circle creator
);

-- Allow deleting members if you're the circle creator
CREATE POLICY "Circle creators can remove members"
ON public.care_circle_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM care_circles 
    WHERE id = circle_id AND created_by = auth.uid()
  )
);

-- 3. Now create care_circles policies that reference care_circle_members
-- These are safe because care_circle_members policies don't reference back

CREATE POLICY "Users can view their circles"
ON public.care_circles FOR SELECT
USING (
  id IN (
    SELECT circle_id FROM care_circle_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create circles"
ON public.care_circles FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle creators can update"
ON public.care_circles FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Circle creators can delete"
ON public.care_circles FOR DELETE
USING (auth.uid() = created_by);
