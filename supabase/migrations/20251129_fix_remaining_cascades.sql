-- Fix remaining foreign keys to cascade delete
-- This covers reactions, marketplace_items, and posts to ensure full account deletion support

-- 1. Fix 'reactions' table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions') THEN
        -- Drop existing constraint if it exists (handling potential name variations)
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reactions_user_id_fkey' AND table_name = 'reactions') THEN
            ALTER TABLE public.reactions DROP CONSTRAINT reactions_user_id_fkey;
        END IF;

        -- Re-add with CASCADE
        ALTER TABLE public.reactions
        ADD CONSTRAINT reactions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix 'marketplace_items' table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
        -- Drop existing constraint
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'marketplace_items_user_id_fkey' AND table_name = 'marketplace_items') THEN
            ALTER TABLE public.marketplace_items DROP CONSTRAINT marketplace_items_user_id_fkey;
        END IF;
        
        -- Also check for 'marketplace_items_seller_id_fkey' just in case
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'marketplace_items_seller_id_fkey' AND table_name = 'marketplace_items') THEN
            ALTER TABLE public.marketplace_items DROP CONSTRAINT marketplace_items_seller_id_fkey;
        END IF;

        -- Re-add with CASCADE (assuming user_id is the column, if it's seller_id this might fail but usually it's user_id or owner)
        -- We'll check column existence first to be safe
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

-- 3. Fix 'posts' table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        -- Drop existing constraint
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_user_id_fkey' AND table_name = 'posts') THEN
            ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_author_id_fkey' AND table_name = 'posts') THEN
            ALTER TABLE public.posts DROP CONSTRAINT posts_author_id_fkey;
        END IF;

        -- Re-add with CASCADE
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
