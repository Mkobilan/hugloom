-- =====================================================
-- ADD INDEXES FOR FOREIGN KEY COLUMNS
-- =====================================================
-- This migration adds indexes on foreign key columns that were
-- missing covering indexes. This improves:
-- - JOIN performance
-- - CASCADE DELETE performance
-- - RLS policy evaluation speed
-- =====================================================

-- calendar_events (5 indexes)
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_to 
  ON public.calendar_events(assigned_to);

CREATE INDEX IF NOT EXISTS idx_calendar_events_circle_id 
  ON public.calendar_events(circle_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_completed_by 
  ON public.calendar_events(completed_by);

CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by 
  ON public.calendar_events(created_by);

CREATE INDEX IF NOT EXISTS idx_calendar_events_medication_id 
  ON public.calendar_events(medication_id);

-- care_circle_members (1 index)
CREATE INDEX IF NOT EXISTS idx_care_circle_members_user_id 
  ON public.care_circle_members(user_id);

-- care_circles (1 index)
CREATE INDEX IF NOT EXISTS idx_care_circles_created_by 
  ON public.care_circles(created_by);

-- comment_reactions (1 index)
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id 
  ON public.comment_reactions(user_id);

-- comments (3 indexes)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
  ON public.comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id 
  ON public.comments(post_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
  ON public.comments(user_id);

-- group_members (1 index)
CREATE INDEX IF NOT EXISTS idx_group_members_user_id 
  ON public.group_members(user_id);

-- groups (1 index)
CREATE INDEX IF NOT EXISTS idx_groups_created_by 
  ON public.groups(created_by);

-- local_hugs (1 index)
CREATE INDEX IF NOT EXISTS idx_local_hugs_user_id 
  ON public.local_hugs(user_id);

-- marketplace_items (1 index)
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id 
  ON public.marketplace_items(seller_id);

-- medications (2 indexes)
CREATE INDEX IF NOT EXISTS idx_medications_circle_id 
  ON public.medications(circle_id);

CREATE INDEX IF NOT EXISTS idx_medications_user_id 
  ON public.medications(user_id);

-- notifications (1 index)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

-- posts (3 indexes)
CREATE INDEX IF NOT EXISTS idx_posts_circle_id 
  ON public.posts(circle_id);

CREATE INDEX IF NOT EXISTS idx_posts_group_id 
  ON public.posts(group_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id 
  ON public.posts(user_id);

-- reactions (1 index)
CREATE INDEX IF NOT EXISTS idx_reactions_user_id 
  ON public.reactions(user_id);

-- typing_indicators (1 index)
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id 
  ON public.typing_indicators(user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Added 23 indexes on foreign key columns across 14 tables:
-- - calendar_events (5)
-- - posts (3)
-- - comments (3)
-- - medications (2)
-- - care_circle_members, care_circles, comment_reactions,
--   group_members, groups, local_hugs, marketplace_items,
--   notifications, reactions, typing_indicators (1 each)
-- =====================================================
