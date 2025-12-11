-- =====================================================
-- DEBUGGING TOOL
-- =====================================================
-- Run this to create a helper function that inspects posts data
-- bypassing RLS to see what is actually in the database.

CREATE OR REPLACE FUNCTION public.debug_posts_visibility()
RETURNS TABLE (
    metric TEXT,
    value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total Posts in DB'::TEXT, COUNT(*) FROM public.posts;

    RETURN QUERY
    SELECT 'Public Posts (null group & circle)'::TEXT, COUNT(*) 
    FROM public.posts 
    WHERE group_id IS NULL AND circle_id IS NULL;

    RETURN QUERY
    SELECT 'Group Posts (group_id not null)'::TEXT, COUNT(*) 
    FROM public.posts 
    WHERE group_id IS NOT NULL;

    RETURN QUERY
    SELECT 'Circle Posts (circle_id not null)'::TEXT, COUNT(*) 
    FROM public.posts 
    WHERE circle_id IS NOT NULL;

    RETURN QUERY
    SELECT 'My User ID'::TEXT, (select count(*) from auth.users where id = auth.uid()); -- 1 if auth, 0 if anon

    RETURN QUERY
    SELECT 'Posts Visible to Me (via RLS)'::TEXT, COUNT(*) 
    FROM public.posts; -- This runs WITH RLS if called as normal user, effectively testing visibility
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Runs with superuser privs to see all raw data counts (except last query)

-- TO RUN THIS DIAGNOSTIC:
-- SELECT * FROM debug_posts_visibility();
