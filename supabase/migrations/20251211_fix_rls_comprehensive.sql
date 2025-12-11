-- =====================================================
-- COMPREHENSIVE RLS FIX
-- =====================================================
-- This migration addresses:
-- 1. Duplicate SELECT policies on profiles and follows
-- 2. Missing search_path on security definer functions
-- 3. Auth initplan performance issues
-- =====================================================

-- =====================================================
-- 1. CLEAN UP DUPLICATE POLICIES ON PROFILES
-- =====================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Stories are live for a day" ON public.profiles;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.profiles;

-- Single consolidated SELECT policy for profiles (simple: everyone can view)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- =====================================================
-- 2. CLEAN UP DUPLICATE POLICIES ON FOLLOWS
-- =====================================================
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can view their follow relationships" ON public.follows;

-- Single consolidated SELECT policy for follows (everyone can view)
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

-- =====================================================
-- 3. FIX SECURITY DEFINER FUNCTIONS WITH PROPER SEARCH_PATH
-- =====================================================
-- Using fully qualified names and setting search_path as required

CREATE OR REPLACE FUNCTION public.can_view_post_authors_content(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_visibility TEXT;
    v_is_following BOOLEAN;
BEGIN
    -- Get visibility setting (default to public if null)
    SELECT COALESCE(post_visibility, 'public') INTO v_visibility
    FROM public.profiles
    WHERE id = target_user_id;

    -- If no profile found, assume public
    IF v_visibility IS NULL THEN
        v_visibility := 'public';
    END IF;

    -- Check logic
    IF v_visibility = 'public' THEN
        RETURN TRUE;
    ELSIF v_visibility = 'followers' THEN
        -- Check if current user is following target user
        SELECT EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = auth.uid()
            AND following_id = target_user_id
        ) INTO v_is_following;
        
        RETURN v_is_following;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT conversation_id
    FROM public.conversation_participants
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 4. FIX POSTS POLICY (using select auth.uid())
-- =====================================================
DROP POLICY IF EXISTS "Posts visibility" ON public.posts;

CREATE POLICY "Posts visibility"
  ON public.posts FOR SELECT
  USING (
    -- 1. Author always sees their own posts
    (select auth.uid()) = user_id
    OR
    -- 2. Group posts (members only)
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = posts.group_id AND user_id = (select auth.uid())
    ))
    OR
    -- 3. Circle posts (members only)
    (circle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.care_circle_members 
      WHERE circle_id = posts.circle_id AND user_id = (select auth.uid())
    ))
    OR
    -- 4. Feed/Profile posts (using secure function)
    (group_id IS NULL AND circle_id IS NULL AND public.can_view_post_authors_content(user_id))
  );

-- =====================================================
-- 5. FIX CONVERSATION/PARTICIPANTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    id IN (SELECT public.get_my_conversation_ids())
  );

CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
