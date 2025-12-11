-- =====================================================
-- FIX MISSING CONTENT (POSTS & CHATS)
-- =====================================================
-- This migration fixes two critical issues:
-- 1. Recursion in conversation_participants policy (causing missing chats)
-- 2. Missing SELECT policies on profiles/follows (causing missing posts)
-- =====================================================

-- 1. FIX CHAT RECURSION
-- =====================================================
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Use the security definer function to avoid recursion
-- (This function was created in 20251126_fix_recursion_final.sql)
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT get_my_conversation_ids())
  );

-- 2. FIX MISSING PROFILES ACCESS
-- =====================================================
-- Posts feed queries profiles to check for public/followers visibility
-- We need to allow authenticated users to view profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- 3. FIX MISSING FOLLOWS ACCESS
-- =====================================================
-- Posts feed queries follows to check for "followers-only" posts
DROP POLICY IF EXISTS "Users can view their follow relationships" ON public.follows;

CREATE POLICY "Users can view their follow relationships"
  ON public.follows FOR SELECT
  USING (
    (select auth.uid()) = follower_id
    OR (select auth.uid()) = following_id
  );
