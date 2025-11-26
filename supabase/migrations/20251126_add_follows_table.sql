-- Create follows table for one-way follow relationships
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  -- Prevent users from following themselves
  check (follower_id != following_id)
);

-- Enable RLS
alter table public.follows enable row level security;

-- RLS Policies
-- Anyone can view follows (needed for displaying counts and follow status)
create policy "Follows are viewable by everyone"
  on follows for select
  using ( true );

-- Users can only create follows where they are the follower
create policy "Users can follow others"
  on follows for insert
  with check ( auth.uid() = follower_id );

-- Users can only delete their own follows
create policy "Users can unfollow others"
  on follows for delete
  using ( auth.uid() = follower_id );

-- Create indexes for better query performance
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
create index idx_follows_created_at on public.follows(created_at);
