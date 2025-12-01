-- =====================================================
-- FIX STORAGE RLS POLICIES FOR IMAGE LOADING
-- =====================================================
-- This migration fixes the partial image loading issue by ensuring
-- that images in public buckets (avatars, post-media) are accessible
-- to all users, not just the uploader.

-- Drop existing SELECT policies that restrict access
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post media is publicly accessible" ON storage.objects;

-- Create new unrestricted SELECT policies for public buckets
-- These allow ANYONE (authenticated or not) to view images
CREATE POLICY "Public access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Public access to post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

-- Note: INSERT, UPDATE, and DELETE policies remain unchanged
-- Users can still only upload/modify/delete their own files
-- The existing policies for these operations are:
-- - "Users can upload their own avatar"
-- - "Users can update their own avatar"
-- - "Users can delete their own avatar"
-- - "Authenticated users can upload post media"
-- - "Users can update their own post media"
-- - "Users can delete their own post media"

-- =====================================================
-- WHAT THIS FIXES:
-- =====================================================
-- Before: Users could only see images they uploaded themselves
-- After: All users can see all images in public buckets
-- Security: Upload/delete still restricted to file owners
-- =====================================================
