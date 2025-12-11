-- =====================================================
-- RLS VERIFICATION SCRIPT
-- =====================================================
-- Run this in the SQL Editor to simulate being a real user.
-- This will confirm if the Database Policies are blocking access.

BEGIN;

-- 1. Switch to 'authenticated' role (like a logged-in user)
SET LOCAL ROLE authenticated;

-- 2. Try to count visible posts
SELECT 'Visible Posts (Authenticated)' as metric, count(*) as count FROM public.posts;

-- 3. Try to count visible profiles
SELECT 'Visible Profiles (Authenticated)' as metric, count(*) as count FROM public.profiles;

-- 4. Switch to 'anon' role (like a non-logged in user)
SET LOCAL ROLE anon;

-- 5. Try to count visible posts
SELECT 'Visible Posts (Anon)' as metric, count(*) as count FROM public.posts;

ROLLBACK;
