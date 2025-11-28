-- NUCLEAR FIX for Notification RLS and Settings
-- Run this in the Supabase SQL Editor

-- 1. Reset Notification Settings Table
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Service role full access settings" ON public.notification_settings;

-- Re-create Policies
CREATE POLICY "Users can view their own notification settings"
    ON public.notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
    ON public.notification_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
    ON public.notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Reset Notifications Table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access notifications" ON public.notifications;

-- Re-create Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- CRITICAL: Allow ANY authenticated user to insert a notification (for others)
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 3. Force Backfill for all users
INSERT INTO public.notification_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
