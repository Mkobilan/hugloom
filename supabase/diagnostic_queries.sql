-- =====================================================
-- DIAGNOSTIC QUERIES FOR IMAGE LOADING ISSUE
-- =====================================================
-- Run these queries in your Supabase SQL Editor to diagnose the issue

-- 1. Check all users and their avatar URLs
SELECT 
    id,
    username,
    avatar_url,
    created_at,
    LENGTH(avatar_url) as url_length,
    CASE 
        WHEN avatar_url IS NULL THEN 'No avatar'
        WHEN avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN 'Correct format'
        ELSE 'Incorrect format'
    END as url_status
FROM profiles
ORDER BY created_at DESC;

-- 2. Check posts with media and their URLs
SELECT 
    p.id,
    p.user_id,
    pr.username,
    p.media_urls,
    p.created_at,
    CASE 
        WHEN p.media_urls IS NULL THEN 'No media'
        WHEN p.media_urls::text LIKE '%/storage/v1/object/public/post-media/%' THEN 'Correct format'
        ELSE 'Incorrect format'
    END as url_status
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.media_urls IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 20;

-- 3. Check storage objects for avatars bucket
-- Note: This requires storage admin privileges
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC;

-- 4. Check storage objects for post-media bucket
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'post-media'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Verify RLS policies are correctly applied
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- =====================================================
-- WHAT TO LOOK FOR:
-- =====================================================
-- Query 1: 
--   - Do both users have avatar_url populated?
--   - Are the URLs in the correct format?
--   - Do they both start with the same base URL?
--
-- Query 2:
--   - Do posts from both users have media_urls?
--   - Are the URLs in the correct format?
--
-- Query 3 & 4:
--   - Do files actually exist in storage for both users?
--   - Are the file paths correct?
--   - Is the 'owner' field set correctly?
--
-- Query 5:
--   - Are the new "Public access" policies present?
--   - Are there any conflicting policies?
-- =====================================================
