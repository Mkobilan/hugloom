-- Add new columns to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid references public.comments(id) on delete cascade,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid default uuid_generate_v4() primary key,
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  type text not null default 'hug',
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

-- Enable RLS on comment_reactions
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for comment_reactions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Comment reactions are viewable by everyone'
    ) THEN
        CREATE POLICY "Comment reactions are viewable by everyone"
          ON comment_reactions FOR SELECT
          USING ( true );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Users can create comment reactions'
    ) THEN
        CREATE POLICY "Users can create comment reactions"
          ON comment_reactions FOR INSERT
          WITH CHECK ( auth.uid() = user_id );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comment_reactions' AND policyname = 'Users can delete own comment reactions'
    ) THEN
        CREATE POLICY "Users can delete own comment reactions"
          ON comment_reactions FOR DELETE
          USING ( auth.uid() = user_id );
    END IF;
END $$;

-- Update policies for comments (ensure they exist)
DO $$ 
BEGIN
    -- We assume basic policies might exist, but let's ensure the update policy is there
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update own comments'
    ) THEN
        CREATE POLICY "Users can update own comments"
          ON comments FOR UPDATE
          USING ( auth.uid() = user_id );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete own comments'
    ) THEN
        CREATE POLICY "Users can delete own comments"
          ON comments FOR DELETE
          USING ( auth.uid() = user_id );
    END IF;
END $$;
