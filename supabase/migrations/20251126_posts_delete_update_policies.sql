-- =====================================================
-- ADD DELETE AND UPDATE POLICIES FOR POSTS
-- =====================================================
-- This migration adds missing RLS policies to allow users
-- to delete and update their own posts

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
