-- =====================================================
-- SIMPLE FIX: RESTORE ORIGINAL POSTS VISIBILITY
-- =====================================================
-- The original posts policy was simple and worked:
--   "Public posts are viewable by everyone" using (group_id is null and circle_id is null)
--
-- The performance migration broke this by adding complex profile visibility checks.
-- This migration restores simple, working policies.
-- =====================================================

-- 1. DROP ALL existing posts SELECT policies
DROP POLICY IF EXISTS "Posts visibility" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Feed posts visibility" ON public.posts;
DROP POLICY IF EXISTS "Group posts viewable by members" ON public.posts;
DROP POLICY IF EXISTS "Circle posts viewable by members" ON public.posts;

-- 2. RECREATE simple, working policies (matching original schema.sql)

-- Public/Feed posts: visible to everyone when no group or circle
CREATE POLICY "Public posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (group_id IS NULL AND circle_id IS NULL);

-- Group posts: visible to group members only
CREATE POLICY "Group posts viewable by members"
  ON public.posts FOR SELECT
  USING (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = posts.group_id AND user_id = (select auth.uid())
    )
  );

-- Circle posts: visible to circle members only
CREATE POLICY "Circle posts viewable by members"
  ON public.posts FOR SELECT
  USING (
    circle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.care_circle_members 
      WHERE circle_id = posts.circle_id AND user_id = (select auth.uid())
    )
  );

-- =====================================================
-- NOTE: This removes the "post_visibility" feature that was 
-- added in 20251127_add_visibility_settings.sql. If you want
-- that feature, we'll need to debug it separately.
-- For now, this gets posts working again.
-- =====================================================
