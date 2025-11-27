-- Create local_hugs table
create table if not exists local_hugs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('volunteer', 'request')),
  services text[] not null,
  city text not null,
  state text not null,
  description text, -- availability for volunteers, details for requests
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table local_hugs enable row level security;

-- Policies
create policy "Local Hugs are viewable by everyone"
  on local_hugs for select
  using (true);

create policy "Users can insert their own Local Hugs"
  on local_hugs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Local Hugs"
  on local_hugs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own Local Hugs"
  on local_hugs for delete
  using (auth.uid() = user_id);
