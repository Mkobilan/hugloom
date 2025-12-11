-- =====================================================
-- FIX RECURSION IN GROUP_MEMBERS
-- =====================================================
-- The policy "Members can view group membership" on public.group_members
-- caused infinite recursion because it selected from group_members to check permissions.
--
-- We fix this by:
-- 1. Creating a SECURITY DEFINER function to get group IDs safely.
-- 2. Updating the policy to use this function.
-- =====================================================

-- 1. Helper Function: Get Group IDs (Security Definer)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS SETOF UUID AS $$
BEGIN
    -- This runs with elevated privileges, bypassing RLS to avoid recursion
    RETURN QUERY
    SELECT group_id
    FROM public.group_members
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Update Group Members Policy
-- =====================================================
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;

CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    -- You can see membership if:
    -- 1. It's your own membership record
    user_id = (select auth.uid())
    OR
    -- 2. You are a member of the group (using secure function)
    group_id IN (SELECT public.get_my_group_ids())
  );

-- 3. Update Groups Policy (Optional but good practice to be consistent)
-- =====================================================
DROP POLICY IF EXISTS "Groups visibility" ON public.groups;

CREATE POLICY "Groups visibility"
  ON public.groups FOR SELECT
  USING (
    is_private = false
    OR created_by = (select auth.uid())
    OR id IN (SELECT public.get_my_group_ids())
  );
