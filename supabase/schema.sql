-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  care_badges jsonb default '[]'::jsonb,
  location text,
  bio text,
  role text default 'caregiver', -- 'caregiver', 'professional', etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- CARE CIRCLES (Family/Close groups for coordination)
create table public.care_circles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.care_circles enable row level security;

create table public.care_circle_members (
  circle_id uuid references public.care_circles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member', -- 'admin', 'member'
  joined_at timestamptz default now(),
  primary key (circle_id, user_id)
);

alter table public.care_circle_members enable row level security;

-- GROUPS (Community groups like "NYC Dementia Dads")
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  location text,
  image_url text,
  is_private boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.groups enable row level security;

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- POSTS (Feed)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content text,
  media_urls text[],
  group_id uuid references public.groups(id), -- Null means public feed or personal wall? Let's say null = public feed.
  circle_id uuid references public.care_circles(id), -- If posted to private circle
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Public posts are viewable by everyone"
  on posts for select
  using ( group_id is null and circle_id is null );

create policy "Group posts viewable by members"
  on posts for select
  using (
    group_id is not null and exists (
      select 1 from group_members where group_id = posts.group_id and user_id = auth.uid()
    )
  );

create policy "Circle posts viewable by members"
  on posts for select
  using (
    circle_id is not null and exists (
      select 1 from care_circle_members where circle_id = posts.circle_id and user_id = auth.uid()
    )
  );

create policy "Users can create posts"
  on posts for insert
  with check ( auth.uid() = user_id );

-- COMMENTS
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

-- REACTIONS
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  type text not null, -- 'hug', 'heart', 'prayer', etc.
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table public.reactions enable row level security;

-- CALENDAR EVENTS
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.care_circles(id) on delete cascade,
  created_by uuid references public.profiles(id),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  is_all_day boolean default false,
  event_type text, -- 'appointment', 'medication', 'visit', 'other'
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

-- MEDICATIONS
create table public.medications (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.care_circles(id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  notes text,
  created_at timestamptz default now()
);

alter table public.medications enable row level security;

-- MARKETPLACE ITEMS
create table public.marketplace_items (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  price numeric,
  currency text default 'USD',
  image_urls text[],
  location text,
  status text default 'available', -- 'available', 'sold', 'pending'
  created_at timestamptz default now()
);

alter table public.marketplace_items enable row level security;

create policy "Marketplace items viewable by everyone"
  on marketplace_items for select
  using ( true );

-- STORAGE BUCKETS (Insert into storage.buckets if needed, usually done via UI or API, but schema can hint)
-- We'll assume buckets 'avatars', 'post-media', 'marketplace-images' exist.

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
