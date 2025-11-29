-- Fix comments foreign key to cascade delete when profiles record is deleted
-- This resolves the "violates foreign key constraint" error on the comments table

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_user_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_user_id_fkey;
    END IF;
END $$;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
