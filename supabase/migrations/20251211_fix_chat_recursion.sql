-- =====================================================
-- FIX RECURSION IN CHATS
-- =====================================================
-- Similar to the groups issue, the chat policies were recursing 
-- by checking conversation_participants to validate access to conversation_participants.
--
-- We fix this by:
-- 1. Creating a SECURITY DEFINER function to get conversation IDs safely.
-- 2. Updating conversation, participant, and message policies to use it (or be compatible with it).
-- =====================================================

-- 1. Helper Function: Get Conversation IDs (Security Definer)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF UUID AS $$
BEGIN
    -- Runs with elevated privileges to avoid RLS recursion
    RETURN QUERY
    SELECT conversation_id
    FROM public.conversation_participants
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Update Conversation Participants Policy
-- =====================================================
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    -- You can see a participant row if:
    -- 1. It is YOU
    user_id = (select auth.uid())
    OR
    -- 2. It belongs to a conversation you are part of (via secure function)
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );

-- 3. Update Conversations Policy
-- =====================================================
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    -- Visible if you are a participant
    id IN (SELECT public.get_my_conversation_ids())
  );

-- 4. Update Messages Policy (Optional but recommended for consistency)
-- =====================================================
-- Messages usually check if you are a participant. Now they can just use the function or the non-recursive participants table.
-- Using the function is cleanest and safest.

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );
