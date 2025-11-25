-- Add RLS policies for reactions table

-- Allow everyone to view reactions
create policy "Reactions are viewable by everyone"
  on reactions for select
  using ( true );

-- Allow authenticated users to insert their own reactions
create policy "Users can insert their own reactions"
  on reactions for insert
  with check ( auth.uid() = user_id );

-- Allow authenticated users to delete their own reactions
create policy "Users can delete their own reactions"
  on reactions for delete
  using ( auth.uid() = user_id );
