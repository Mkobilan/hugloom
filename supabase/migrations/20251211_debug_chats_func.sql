-- =====================================================
-- DEBUGGING TOOL FOR CHATS
-- =====================================================
-- Run this to create a helper function that inspects chat data
-- bypassing RLS to see what is actually in the database.

CREATE OR REPLACE FUNCTION public.debug_chats_visibility()
RETURNS TABLE (
    metric TEXT,
    value BIGINT,
    details TEXT
) AS $$
DECLARE
    v_my_uid UUID := auth.uid();
BEGIN
    -- 1. Total Raw Conversations
    RETURN QUERY
    SELECT 
        'Total Conversations in DB'::TEXT, 
        COUNT(*),
        'Raw count'::TEXT
    FROM public.conversations;

    -- 2. My Participations (Raw)
    RETURN QUERY
    SELECT 
        'Conversations I am participating in (Raw)'::TEXT, 
        COUNT(*),
        'Checked via public.conversation_participants table'::TEXT
    FROM public.conversation_participants
    WHERE user_id = v_my_uid;

    -- 3. Visible Conversations (RLS)
    RETURN QUERY
    SELECT 
        'Visible Conversations (RLS)'::TEXT, 
        COUNT(*),
        'Checked via public.conversations view'::TEXT
    FROM public.conversations;

    -- 4. Potential Issues: Archived?
    RETURN QUERY
    SELECT 
        'My Archived Conversations'::TEXT, 
        COUNT(*),
        'is_archived = true'::TEXT
    FROM public.conversation_participants
    WHERE user_id = v_my_uid AND is_archived = true;

    -- 5. Potential Issues: Null Last Message? (Ordering issue)
    RETURN QUERY
    SELECT 
        'My Conversations with NULL last_message_at'::TEXT, 
        COUNT(*),
        'Could cause sort order issues'::TEXT
    FROM public.conversations c
    JOIN public.conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = v_my_uid AND c.last_message_at IS NULL;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TO RUN THIS DIAGNOSTIC:
-- SELECT * FROM debug_chats_visibility();
