-- Fix RLS policies for notifications to allow users to trigger notifications for others
-- and ensure notification settings are accessible.

-- 1. Fix Notifications INSERT Policy
-- Allow authenticated users to insert notifications for ANY user (needed for cross-user notifications like messages/comments)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Fix Notification Settings Policies
-- Ensure users can view/update their own settings.
-- The previous policies were correct: "Users can view their own notification settings" using (auth.uid() = user_id)
-- However, if the 406 persists, it might be because the row doesn't exist.
-- We will re-run the backfill just in case.

INSERT INTO public.notification_settings (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.notification_settings)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Allow Service Role full access (just in case we use server-side admin client later)
DROP POLICY IF EXISTS "Service role full access notifications" ON public.notifications;
CREATE POLICY "Service role full access notifications"
    ON public.notifications
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access settings" ON public.notification_settings;
CREATE POLICY "Service role full access settings"
    ON public.notification_settings
    USING (auth.role() = 'service_role');
