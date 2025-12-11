-- =====================================================
-- DETAILED CONVERSATION INSPECTION
-- =====================================================
-- Run this to see the actual state of conversations in the DB.
-- It lists the top 50 recent conversations and who is in them.

CREATE OR REPLACE FUNCTION public.inspect_conversations_data()
RETURNS TABLE (
    conv_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    participant_count BIGINT,
    participant_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, 
        c.created_at, 
        c.last_message_at,
        (SELECT COUNT(*) FROM public.conversation_participants cp WHERE cp.conversation_id = c.id),
        (SELECT ARRAY_AGG(user_id) FROM public.conversation_participants cp WHERE cp.conversation_id = c.id)
    FROM public.conversations c
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- TO RUN:
-- SELECT * FROM inspect_conversations_data();
