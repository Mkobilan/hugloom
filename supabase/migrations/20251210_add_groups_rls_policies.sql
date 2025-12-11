-- =====================================================
-- ADD RLS POLICIES FOR GROUPS AND GROUP_MEMBERS
-- =====================================================
-- These tables had RLS enabled but no policies defined.
-- =====================================================

-- =====================================================
-- GROUPS TABLE
-- =====================================================

-- Anyone can view public groups; private groups visible to members
CREATE POLICY "Groups visibility"
  ON public.groups FOR SELECT
  USING (
    is_private = false
    OR (select auth.uid()) = created_by
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id
      AND user_id = (select auth.uid())
    )
  );

-- Authenticated users can create groups
CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);

-- Only group creator can update
CREATE POLICY "Group creators can update"
  ON public.groups FOR UPDATE
  USING ((select auth.uid()) = created_by);

-- Only group creator can delete
CREATE POLICY "Group creators can delete"
  ON public.groups FOR DELETE
  USING ((select auth.uid()) = created_by);

-- =====================================================
-- GROUP_MEMBERS TABLE
-- =====================================================

-- Members can view other members of groups they belong to
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = (select auth.uid())
    )
  );

-- Users can join public groups, or be added by group creator
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    -- Can add yourself to public groups
    ((select auth.uid()) = user_id AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND is_private = false
    ))
    OR
    -- Group creator can add anyone
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND created_by = (select auth.uid())
    )
  );

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id AND created_by = (select auth.uid())
    )
  );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Added 7 RLS policies:
-- - groups: SELECT, INSERT, UPDATE, DELETE
-- - group_members: SELECT, INSERT, DELETE
-- =====================================================
