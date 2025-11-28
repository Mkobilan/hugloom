-- Create notifications table
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    type text not null check (type in ('message', 'care_circle', 'feed', 'care_task', 'calendar', 'follower', 'comment_reply')),
    title text not null,
    message text not null,
    link text,
    read boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notification_settings table
create table if not exists public.notification_settings (
    user_id uuid references public.profiles(id) on delete cascade primary key,
    email_notifications boolean default true,
    push_notifications boolean default true,
    categories jsonb default '{
        "messages": true,
        "care_circle": true,
        "feed": true,
        "care_task": true,
        "calendar": true,
        "follower": true,
        "comment_reply": true
    }'::jsonb,
    care_task_reminder_minutes integer[] default array[15],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;

-- Policies for notifications
create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

-- Policies for notification_settings
create policy "Users can view their own notification settings"
    on public.notification_settings for select
    using (auth.uid() = user_id);

create policy "Users can update their own notification settings"
    on public.notification_settings for update
    using (auth.uid() = user_id);

create policy "Users can insert their own notification settings"
    on public.notification_settings for insert
    with check (auth.uid() = user_id);

-- Function to handle new user settings creation
create or replace function public.handle_new_user_settings()
returns trigger as $$
begin
    insert into public.notification_settings (user_id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to create settings on profile creation
-- Note: This assumes profiles are created when users sign up. 
-- If you already have a trigger on auth.users for profiles, you might want to add this there or keep it separate.
-- For now, we'll attach it to profiles insert if possible, or just rely on the app to create it if missing.
-- A safer bet for existing users is to just insert if not exists in the app logic or use a separate migration script for backfilling.
