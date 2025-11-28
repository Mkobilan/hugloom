-- Enable Realtime for Notifications Table
-- This allows real-time subscriptions to receive INSERT and UPDATE events

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
