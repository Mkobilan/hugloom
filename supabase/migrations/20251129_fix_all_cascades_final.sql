-- FINAL COMPREHENSIVE FIX for all Foreign Key Cascade issues
-- This script safely checks and updates all known tables that reference profiles/users
-- to ensure they have ON DELETE CASCADE.

-- 1. Fix 'calendar_events' (The current blocker)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
        -- Drop existing constraint
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'calendar_events_created_by_fkey' AND table_name = 'calendar_events') THEN
            ALTER TABLE public.calendar_events DROP CONSTRAINT calendar_events_created_by_fkey;
        END IF;

        -- Re-add with CASCADE
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'created_by') THEN
            ALTER TABLE public.calendar_events
            ADD CONSTRAINT calendar_events_created_by_fkey
            FOREIGN KEY (created_by)
            REFERENCES public.profiles(id)
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Fix 'reactions' (Previous blocker)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reactions_user_id_fkey' AND table_name = 'reactions') THEN
            ALTER TABLE public.reactions DROP CONSTRAINT reactions_user_id_fkey;
        END IF;

        ALTER TABLE public.reactions
        ADD CONSTRAINT reactions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Fix 'marketplace_items' (Potential blocker)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'marketplace_items_user_id_fkey' AND table_name = 'marketplace_items') THEN
            ALTER TABLE public.marketplace_items DROP CONSTRAINT marketplace_items_user_id_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'marketplace_items_seller_id_fkey' AND table_name = 'marketplace_items') THEN
            ALTER TABLE public.marketplace_items DROP CONSTRAINT marketplace_items_seller_id_fkey;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_items' AND column_name = 'user_id') THEN
            ALTER TABLE public.marketplace_items
            ADD CONSTRAINT marketplace_items_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES public.profiles(id)
            ON DELETE CASCADE;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_items' AND column_name = 'seller_id') THEN
             ALTER TABLE public.marketplace_items
            ADD CONSTRAINT marketplace_items_seller_id_fkey
            FOREIGN KEY (seller_id)
            REFERENCES public.profiles(id)
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. Fix 'posts' (Potential blocker)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_user_id_fkey' AND table_name = 'posts') THEN
            ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_author_id_fkey' AND table_name = 'posts') THEN
            ALTER TABLE public.posts DROP CONSTRAINT posts_author_id_fkey;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'user_id') THEN
            ALTER TABLE public.posts
            ADD CONSTRAINT posts_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES public.profiles(id)
            ON DELETE CASCADE;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_id') THEN
            ALTER TABLE public.posts
            ADD CONSTRAINT posts_author_id_fkey
            FOREIGN KEY (author_id)
            REFERENCES public.profiles(id)
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 5. Fix 'comments' (Previous blocker)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comments_user_id_fkey' AND table_name = 'comments') THEN
            ALTER TABLE public.comments DROP CONSTRAINT comments_user_id_fkey;
        END IF;

        ALTER TABLE public.comments
        ADD CONSTRAINT comments_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;
