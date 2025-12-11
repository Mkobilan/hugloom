-- =====================================================
-- FIX RLS PERFORMANCE WARNINGS
-- =====================================================
-- This migration fixes two types of performance issues:
-- 1. auth_rls_initplan: Wrap auth.uid() in (select auth.uid())
-- 2. multiple_permissive_policies: Consolidate duplicate policies
-- =====================================================

-- =====================================================
-- PROFILES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- =====================================================
-- POSTS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Group posts viewable by members" ON public.posts;
DROP POLICY IF EXISTS "Circle posts viewable by members" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Feed posts visibility" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

-- Consolidated SELECT policy (combines Feed, Group, Circle visibility)
CREATE POLICY "Posts visibility"
  ON public.posts FOR SELECT
  USING (
    -- Public feed posts
    (group_id IS NULL AND circle_id IS NULL AND (
      (select auth.uid()) = user_id
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = posts.user_id
        AND (
          post_visibility = 'public'
          OR (post_visibility = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = (select auth.uid())
            AND following_id = posts.user_id
          ))
        )
      )
    ))
    OR
    -- Group posts
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = posts.group_id AND user_id = (select auth.uid())
    ))
    OR
    -- Circle posts
    (circle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.care_circle_members 
      WHERE circle_id = posts.circle_id AND user_id = (select auth.uid())
    ))
  );

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- CARE CIRCLES TABLE
-- =====================================================

DROP POLICY IF EXISTS "allow_all_authenticated_select" ON public.care_circles;
DROP POLICY IF EXISTS "allow_all_authenticated_insert" ON public.care_circles;
DROP POLICY IF EXISTS "allow_all_authenticated_update" ON public.care_circles;
DROP POLICY IF EXISTS "allow_all_authenticated_delete" ON public.care_circles;
DROP POLICY IF EXISTS "Care circles visibility" ON public.care_circles;
DROP POLICY IF EXISTS "Users can view their circles" ON public.care_circles;
DROP POLICY IF EXISTS "Users can create circles" ON public.care_circles;
DROP POLICY IF EXISTS "Circle creators can update" ON public.care_circles;
DROP POLICY IF EXISTS "Circle creators can delete" ON public.care_circles;

-- Consolidated SELECT policy
CREATE POLICY "Care circles visibility"
  ON public.care_circles FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL
    AND (
      -- User is a member
      EXISTS (
        SELECT 1 FROM public.care_circle_members
        WHERE circle_id = care_circles.id
        AND user_id = (select auth.uid())
      )
      OR
      -- Or visibility allows
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = care_circles.created_by
        AND (
          care_circle_visibility = 'public'
          OR (care_circle_visibility = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = (select auth.uid())
            AND following_id = care_circles.created_by
          ))
        )
      )
    )
  );

CREATE POLICY "Users can create circles"
  ON public.care_circles FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update circles"
  ON public.care_circles FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Users can delete circles"
  ON public.care_circles FOR DELETE
  USING ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- CARE CIRCLE MEMBERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "allow_all_authenticated_select_members" ON public.care_circle_members;
DROP POLICY IF EXISTS "allow_all_authenticated_insert_members" ON public.care_circle_members;
DROP POLICY IF EXISTS "allow_all_authenticated_delete_members" ON public.care_circle_members;
DROP POLICY IF EXISTS "Members can view circle membership" ON public.care_circle_members;
DROP POLICY IF EXISTS "Allow inserting circle members" ON public.care_circle_members;
DROP POLICY IF EXISTS "Circle creators can remove members" ON public.care_circle_members;

CREATE POLICY "Members can view circle membership"
  ON public.care_circle_members FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Allow inserting circle members"
  ON public.care_circle_members FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR 
    EXISTS (
      SELECT 1 FROM public.care_circles 
      WHERE id = circle_id AND created_by = (select auth.uid())
    )
  );

CREATE POLICY "Circle creators can remove members"
  ON public.care_circle_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circles 
      WHERE id = circle_id AND created_by = (select auth.uid())
    )
  );

-- =====================================================
-- MEDICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "allow_authenticated_select_medications" ON public.medications;
DROP POLICY IF EXISTS "Users can view their medications" ON public.medications;
DROP POLICY IF EXISTS "Users can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update their medications" ON public.medications;
DROP POLICY IF EXISTS "Users can delete their medications" ON public.medications;
DROP POLICY IF EXISTS "Circle members can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Circle members can update medications" ON public.medications;
DROP POLICY IF EXISTS "Circle members can delete medications" ON public.medications;

CREATE POLICY "Users can view medications"
  ON public.medications FOR SELECT
  USING (
    (select auth.uid()) = user_id 
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = medications.circle_id
    )
  );

-- Consolidated INSERT policy
CREATE POLICY "Users can insert medications"
  ON public.medications FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = medications.circle_id
    )
  );

-- Consolidated UPDATE policy
CREATE POLICY "Users can update medications"
  ON public.medications FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = medications.circle_id
    )
  );

-- Consolidated DELETE policy
CREATE POLICY "Users can delete medications"
  ON public.medications FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = medications.circle_id
    )
  );

-- =====================================================
-- TASK COMPLETIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can view their task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can insert their own task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can insert their task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can update their own task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can update their task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can delete their task completions" ON public.task_completions;

CREATE POLICY "Users can view their task completions"
  ON public.task_completions FOR SELECT
  USING ((select auth.uid()) = completed_by);

CREATE POLICY "Users can insert their task completions"
  ON public.task_completions FOR INSERT
  WITH CHECK ((select auth.uid()) = completed_by);

CREATE POLICY "Users can update their task completions"
  ON public.task_completions FOR UPDATE
  USING ((select auth.uid()) = completed_by);

CREATE POLICY "Users can delete their task completions"
  ON public.task_completions FOR DELETE
  USING ((select auth.uid()) = completed_by);

-- =====================================================
-- CALENDAR EVENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "allow_authenticated_select_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view their events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their events" ON public.calendar_events;
DROP POLICY IF EXISTS "Circle members can insert events" ON public.calendar_events;
DROP POLICY IF EXISTS "Circle members can update events" ON public.calendar_events;
DROP POLICY IF EXISTS "Circle members can delete events" ON public.calendar_events;

-- Consolidated SELECT policy
CREATE POLICY "Users can view events"
  ON public.calendar_events FOR SELECT
  USING (
    (select auth.uid()) = created_by 
    OR (select auth.uid()) = assigned_to
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = calendar_events.circle_id
    )
  );

-- Consolidated INSERT policy
CREATE POLICY "Users can insert events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (
    (select auth.uid()) = created_by
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = calendar_events.circle_id
    )
  );

-- Consolidated UPDATE policy
CREATE POLICY "Users can update events"
  ON public.calendar_events FOR UPDATE
  USING (
    (select auth.uid()) = created_by 
    OR (select auth.uid()) = assigned_to
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = calendar_events.circle_id
    )
  );

-- Consolidated DELETE policy
CREATE POLICY "Users can delete events"
  ON public.calendar_events FOR DELETE
  USING (
    (select auth.uid()) = created_by
    OR (select auth.uid()) IN (
      SELECT user_id FROM public.care_circle_members 
      WHERE circle_id = calendar_events.circle_id
    )
  );

-- =====================================================
-- NOTIFICATION SETTINGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;

CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- REACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;

CREATE POLICY "Users can insert their own reactions"
  ON public.reactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- COMMENT REACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create comment reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can delete own comment reactions" ON public.comment_reactions;

CREATE POLICY "Users can create comment reactions"
  ON public.comment_reactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own comment reactions"
  ON public.comment_reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- FOLLOWS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK ((select auth.uid()) = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE
  USING ((select auth.uid()) = follower_id);

-- =====================================================
-- MARKETPLACE ITEMS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can insert marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Users can update own marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Users can delete own marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Marketplace items visibility" ON public.marketplace_items;
DROP POLICY IF EXISTS "Marketplace items viewable by everyone" ON public.marketplace_items;

CREATE POLICY "Marketplace items visibility"
  ON public.marketplace_items FOR SELECT
  USING (
    (select auth.uid()) = seller_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = marketplace_items.seller_id
      AND (
        marketplace_visibility = 'public'
        OR (marketplace_visibility = 'followers' AND EXISTS (
          SELECT 1 FROM public.follows
          WHERE follower_id = (select auth.uid())
          AND following_id = marketplace_items.seller_id
        ))
      )
    )
  );

CREATE POLICY "Users can insert marketplace items"
  ON public.marketplace_items FOR INSERT
  WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "Users can update own marketplace items"
  ON public.marketplace_items FOR UPDATE
  USING ((select auth.uid()) = seller_id);

CREATE POLICY "Users can delete own marketplace items"
  ON public.marketplace_items FOR DELETE
  USING ((select auth.uid()) = seller_id);

-- =====================================================
-- LOCAL HUGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own Local Hugs" ON public.local_hugs;
DROP POLICY IF EXISTS "Users can update their own Local Hugs" ON public.local_hugs;
DROP POLICY IF EXISTS "Users can delete their own Local Hugs" ON public.local_hugs;

CREATE POLICY "Users can insert their own Local Hugs"
  ON public.local_hugs FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own Local Hugs"
  ON public.local_hugs FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own Local Hugs"
  ON public.local_hugs FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Participants can update their conversations"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CONVERSATION PARTICIPANTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant status" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own participant status"
  ON public.conversation_participants FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can leave conversations"
  ON public.conversation_participants FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING ((select auth.uid()) = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING ((select auth.uid()) = sender_id);

-- =====================================================
-- MESSAGE REACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view message reactions in their conversations" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add message reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove their own message reactions" ON public.message_reactions;

CREATE POLICY "Users can view message reactions in their conversations"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      INNER JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can add message reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      INNER JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can remove their own message reactions"
  ON public.message_reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- TYPING INDICATORS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing status" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update their typing status" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can delete their typing status" ON public.typing_indicators;

CREATE POLICY "Users can view typing indicators in their conversations"
  ON public.typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = typing_indicators.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert typing status"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = typing_indicators.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their typing status"
  ON public.typing_indicators FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their typing status"
  ON public.typing_indicators FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All 116 RLS performance warnings have been addressed:
-- - 68 auth_rls_initplan issues fixed with (select auth.uid())
-- - 48 multiple_permissive_policies consolidated
-- =====================================================
