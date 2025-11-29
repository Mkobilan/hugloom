-- Fix profiles foreign key to cascade delete when auth.users record is deleted
-- This resolves the "violates foreign key constraint" error during account deletion

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    -- We use a DO block to handle potential naming variations safely, though the error confirmed "profiles_id_fkey"
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
