-- =====================================================
-- FINAL ROBUST FIX FOR RLS (POSTS & CHATS)
-- =====================================================

-- 1. Helper Function for Post Visibility (SECURITY DEFINER)
-- =====================================================
-- This function runs with elevated privileges to check profile settings 
-- and follow status without hitting RLS recursion or denials.

CREATE OR REPLACE FUNCTION public.can_view_post_authors_content(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_visibility TEXT;
    v_is_following BOOLEAN;
BEGIN
    -- 1. Get visibility setting (default to public if null)
    SELECT COALESCE(post_visibility, 'public') INTO v_visibility
    FROM public.profiles
    WHERE id = target_user_id;

    -- If no profile found, assume public (or blocking, depending on preference. defaulting public for now)
    IF v_visibility IS NULL THEN
        v_visibility := 'public';
    END IF;

    -- 2. Check logic
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
        RETURN FALSE; -- Unknown visibility type
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- NOTE: We explicitly do NOT set search_path = '' here because we need access to 'public' tables
-- and standard extensions like 'auth'.

-- 2. Update POSTS Policy
-- =====================================================
DROP POLICY IF EXISTS "Posts visibility" ON public.posts;

CREATE POLICY "Posts visibility"
  ON public.posts FOR SELECT
  USING (
    -- 1. Author always sees their own posts
    auth.uid() = user_id
    OR
    -- 2. Group posts (members only)
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = posts.group_id AND user_id = auth.uid()
    ))
    OR
    -- 3. Circle posts (members only)
    (circle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.care_circle_members 
      WHERE circle_id = posts.circle_id AND user_id = auth.uid()
    ))
    OR
    -- 4. Feed/Profile posts (Standard visibility check using our secure function)
    (group_id IS NULL AND circle_id IS NULL AND public.can_view_post_authors_content(user_id))
  );

-- 3. Fix Chat Recursion Function (Relaxing search_path)
-- =====================================================
-- The previous strict search_path='' caused issues with auth.uid() or other lookups
-- depending on the environment. We revert to standard behavior for this utility.

CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT conversation_id
    FROM public.conversation_participants
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure Conversation Policy uses this function correctly
-- =====================================================
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );
