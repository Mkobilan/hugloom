-- =====================================================
-- SUPABASE STORAGE SETUP FOR POST MEDIA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create the post-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,  -- Make bucket public so media URLs work without auth
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for post-media bucket

-- Allow anyone to view post media (since bucket is public)
CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

-- Allow authenticated users to upload post media
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own post media
CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post media
CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this SQL:
-- 1. Post media will be stored in the 'post-media' bucket
-- 2. File structure: post-media/{user_id}/{timestamp}_{filename}
-- 3. Public URLs will be automatically generated
-- 4. Max file size: 10MB
-- 5. Allowed formats: JPEG, PNG, WebP, GIF
-- =====================================================
