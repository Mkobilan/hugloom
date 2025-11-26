-- =====================================================
-- ENABLE REALTIME FOR CHAT TABLES
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- Add chat tables to the supabase_realtime publication
-- This allows the frontend to listen for changes (INSERT, UPDATE, DELETE)

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_participants;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.typing_indicators;

-- Verify it's enabled (optional, just for info)
-- select * from pg_publication_tables where pubname = 'supabase_realtime';
