-- =====================================================
-- SUPABASE STORAGE SETUP FOR PROFILE PHOTOS
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Make bucket public so avatar URLs work without auth
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for avatars bucket

-- Allow anyone to view avatars (since bucket is public)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this SQL:
-- 1. Avatars will be stored in the 'avatars' bucket
-- 2. File structure: avatars/{user_id}/{filename}
-- 3. Public URLs will be automatically generated
-- 4. Max file size: 5MB
-- 5. Allowed formats: JPEG, PNG, WebP, GIF
-- =====================================================
