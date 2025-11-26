-- =====================================================
-- CHAT SYSTEM FINAL FIX (RECURSION & POLICIES)
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop problematic policies and functions
drop policy if exists "Users can view participants in their conversations" on conversation_participants;
drop function if exists is_conversation_participant(uuid);

-- 2. Create a robust SECURITY DEFINER function to get my conversations
-- This function runs as the database owner (bypassing RLS) to safely fetch the list of conversations the user is in.
create or replace function get_my_conversation_ids()
returns setof uuid as $$
begin
  return query
  select conversation_id
  from conversation_participants
  where user_id = auth.uid();
end;
$$ language plpgsql security definer;

-- 3. Re-create the policy using the new function
-- This avoids the infinite recursion because we don't query the table directly in the policy condition in a way that triggers RLS recursively.
create policy "Users can view participants in their conversations"
  on conversation_participants for select
  using (
    conversation_id in (select get_my_conversation_ids())
  );

-- 4. Ensure other policies are also safe (Conversations table)
drop policy if exists "Users can view their conversations" on conversations;
drop policy if exists "Participants can update their conversations" on conversations;

create policy "Users can view their conversations"
  on conversations for select
  using (
    id in (select get_my_conversation_ids())
  );

create policy "Participants can update their conversations"
  on conversations for update
  using (
    id in (select get_my_conversation_ids())
  );
