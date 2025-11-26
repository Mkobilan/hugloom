-- =====================================================
-- CHAT SYSTEM MIGRATION (FIXED ORDER)
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create all tables first to avoid dependency issues
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_message_at timestamptz default now(),
  last_message_preview text -- Store preview of last message for conversation list
);

create table public.conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  is_archived boolean default false, -- For hiding conversations
  unique(conversation_id, user_id)
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false,
  is_edited boolean default false,
  media_url text, -- For image/file attachments
  media_type text, -- 'image' or 'file'
  media_filename text, -- Original filename
  media_size integer -- File size in bytes
);

create table public.message_reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'hug', 'heart', 'thumbs_up'
  created_at timestamptz default now(),
  unique(message_id, user_id, type) -- One reaction type per user per message
);

create table public.typing_indicators (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  updated_at timestamptz default now(),
  unique(conversation_id, user_id)
);

-- 2. Enable RLS on all tables
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.typing_indicators enable row level security;

-- 3. Create Indexes
create index idx_conversations_last_message on public.conversations(last_message_at desc);
create index idx_conversation_participants_conversation on public.conversation_participants(conversation_id);
create index idx_conversation_participants_user on public.conversation_participants(user_id);
create index idx_conversation_participants_last_read on public.conversation_participants(last_read_at);
create index idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_message_reactions_message on public.message_reactions(message_id);
create index idx_message_reactions_user on public.message_reactions(user_id);
create index idx_typing_indicators_conversation on public.typing_indicators(conversation_id);

-- 4. RLS Policies (Now safe to create as all tables exist)

-- Conversations Policies
create policy "Users can view their conversations"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = conversations.id
      and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on conversations for insert
  with check ( auth.uid() is not null );

create policy "Participants can update their conversations"
  on conversations for update
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = conversations.id
      and user_id = auth.uid()
    )
  );

-- Conversation Participants Policies
create policy "Users can view participants in their conversations"
  on conversation_participants for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Users can join conversations"
  on conversation_participants for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own participant status"
  on conversation_participants for update
  using ( auth.uid() = user_id );

create policy "Users can leave conversations"
  on conversation_participants for delete
  using ( auth.uid() = user_id );

-- Messages Policies
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update their own messages"
  on messages for update
  using ( auth.uid() = sender_id );

create policy "Users can delete their own messages"
  on messages for delete
  using ( auth.uid() = sender_id );

-- Message Reactions Policies
create policy "Users can view message reactions in their conversations"
  on message_reactions for select
  using (
    exists (
      select 1 from messages m
      inner join conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Users can add message reactions"
  on message_reactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from messages m
      inner join conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Users can remove their own message reactions"
  on message_reactions for delete
  using ( auth.uid() = user_id );

-- Typing Indicators Policies
create policy "Users can view typing indicators in their conversations"
  on typing_indicators for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = typing_indicators.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update their own typing status"
  on typing_indicators for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from conversation_participants
      where conversation_id = typing_indicators.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update their typing status"
  on typing_indicators for update
  using ( auth.uid() = user_id );

create policy "Users can delete their typing status"
  on typing_indicators for delete
  using ( auth.uid() = user_id );

-- 5. Storage Bucket for Message Attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,  -- Private bucket, requires authentication
  10485760,  -- 10MB limit
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- Storage policies for message attachments
create policy "Users can view attachments in their conversations"
on storage.objects for select
using (
  bucket_id = 'message-attachments'
  and exists (
    select 1 from messages m
    inner join conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.media_url like '%' || storage.objects.name || '%'
    and cp.user_id = auth.uid()
  )
);

create policy "Users can upload message attachments"
on storage.objects for insert
with check (
  bucket_id = 'message-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own message attachments"
on storage.objects for delete
using (
  bucket_id = 'message-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Helper Functions

-- Function to get or create a direct conversation between two users
create or replace function get_or_create_conversation(
  user1_id uuid,
  user2_id uuid
) returns uuid as $$
declare
  existing_conversation_id uuid;
  new_conversation_id uuid;
begin
  -- Check if conversation already exists between these two users
  select cp1.conversation_id into existing_conversation_id
  from conversation_participants cp1
  inner join conversation_participants cp2 
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = user1_id
    and cp2.user_id = user2_id
    and (
      select count(*) from conversation_participants
      where conversation_id = cp1.conversation_id
    ) = 2; -- Ensure it's a 1-on-1 conversation
  
  if existing_conversation_id is not null then
    return existing_conversation_id;
  end if;
  
  -- Create new conversation
  insert into conversations (created_at, updated_at, last_message_at)
  values (now(), now(), now())
  returning id into new_conversation_id;
  
  -- Add both participants
  insert into conversation_participants (conversation_id, user_id)
  values 
    (new_conversation_id, user1_id),
    (new_conversation_id, user2_id);
  
  return new_conversation_id;
end;
$$ language plpgsql security definer;

-- Function to update conversation's last_message_at when new message is sent
create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update conversations
  set 
    last_message_at = new.created_at,
    last_message_preview = substring(new.content, 1, 100),
    updated_at = now()
  where id = new.conversation_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically update conversation when message is sent
create trigger on_message_created
  after insert on messages
  for each row
  execute function update_conversation_last_message();
