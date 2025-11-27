-- Add visibility columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS post_visibility text DEFAULT 'public' CHECK (post_visibility IN ('public', 'followers')),
ADD COLUMN IF NOT EXISTS care_circle_visibility text DEFAULT 'public' CHECK (care_circle_visibility IN ('public', 'followers')),
ADD COLUMN IF NOT EXISTS marketplace_visibility text DEFAULT 'public' CHECK (marketplace_visibility IN ('public', 'followers'));

-- Update RLS policies for POSTS

-- Drop existing public/feed policy if it conflicts or needs refinement
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

-- Create new policy for feed posts (group_id is null and circle_id is null)
CREATE POLICY "Feed posts visibility"
ON public.posts FOR SELECT
USING (
  (group_id IS NULL AND circle_id IS NULL)
  AND
  (
    -- Author always sees own posts
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = public.posts.user_id
      AND (
        -- Public setting
        post_visibility = 'public'
        OR
        -- Followers only setting
        (post_visibility = 'followers' AND EXISTS (
          SELECT 1 FROM public.follows
          WHERE follower_id = auth.uid()
          AND following_id = public.posts.user_id
        ))
      )
    )
  )
);

-- Update RLS policies for MARKETPLACE ITEMS

DROP POLICY IF EXISTS "Marketplace items viewable by everyone" ON public.marketplace_items;

CREATE POLICY "Marketplace items visibility"
ON public.marketplace_items FOR SELECT
USING (
  -- Seller always sees own items
  auth.uid() = seller_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = public.marketplace_items.seller_id
    AND (
      marketplace_visibility = 'public'
      OR
      (marketplace_visibility = 'followers' AND EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
        AND following_id = public.marketplace_items.seller_id
      ))
    )
  )
);

-- Update RLS policies for CARE CIRCLES
-- Note: Access to the *content* of a care circle is already restricted to members.
-- This policy controls who can see the *existence* of a care circle (e.g. on a user's profile list).

-- We need to ensure we don't break the ability for members to see their own circles.
-- The existing policy likely allows members to see circles. We should add to it or ensure this doesn't conflict.
-- Assuming there was no explicit "select" policy for care_circles in the schema.sql provided, or it was generic.
-- Let's create a policy that covers both: Members can see it, AND non-members can see it IF visibility allows.

DROP POLICY IF EXISTS "Care circles viewable by members" ON public.care_circles; -- Just in case

CREATE POLICY "Care circles visibility"
ON public.care_circles FOR SELECT
USING (
  -- User is a member (or owner)
  EXISTS (
    SELECT 1 FROM public.care_circle_members
    WHERE circle_id = public.care_circles.id
    AND user_id = auth.uid()
  )
  OR
  -- Or visibility allows (for profile listing)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = public.care_circles.created_by
    AND (
      care_circle_visibility = 'public'
      OR
      (care_circle_visibility = 'followers' AND EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
        AND following_id = public.care_circles.created_by
      ))
    )
  )
);
