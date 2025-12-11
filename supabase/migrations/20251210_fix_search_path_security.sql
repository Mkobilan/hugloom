-- =====================================================
-- SECURITY FIX: Function Search Path Mutable
-- =====================================================
-- This migration fixes 14 functions that were flagged by Supabase Security Advisor
-- for having a mutable search_path. Adding SET search_path = '' ensures the functions
-- cannot be exploited by users manipulating their session's search_path.
--
-- Run this in your Supabase SQL Editor.
-- =====================================================

-- 1. handle_new_user_settings (from 20251128_notifications.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. handle_new_user (from schema.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. create_notification_if_allowed (from 20251128_add_notification_triggers.sql)
CREATE OR REPLACE FUNCTION public.create_notification_if_allowed(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_settings JSONB;
    v_allowed BOOLEAN;
    v_notification_id UUID;
BEGIN
    -- Fetch user settings
    SELECT categories INTO v_settings
    FROM public.notification_settings
    WHERE user_id = p_user_id;

    -- Determine if notification is allowed (default to true if settings missing or category not specified)
    IF v_settings IS NULL OR v_settings->p_type IS NULL OR (v_settings->>p_type)::BOOLEAN = TRUE THEN
        v_allowed := TRUE;
    ELSE
        v_allowed := FALSE;
    END IF;

    -- Insert notification if allowed
    IF v_allowed THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
        VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
        RETURNING id INTO v_notification_id;
        
        RETURN v_notification_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. handle_new_message_notification (from 20251128_add_notification_triggers.sql)
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
BEGIN
    -- Find the other participant in the conversation
    SELECT user_id INTO v_recipient_id
    FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    LIMIT 1;

    IF v_recipient_id IS NOT NULL THEN
        PERFORM public.create_notification_if_allowed(
            v_recipient_id,
            'message',
            'New Message',
            CASE 
                WHEN length(NEW.content) > 50 THEN substring(NEW.content from 1 for 50) || '...'
                ELSE NEW.content
            END,
            '/messages',
            jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. handle_new_comment_notification (from 20251128_add_notification_triggers.sql)
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_parent_comment_owner_id UUID;
    v_commenter_name TEXT;
BEGIN
    -- Get commenter's username
    SELECT username INTO v_commenter_name FROM public.profiles WHERE id = NEW.user_id;
    IF v_commenter_name IS NULL THEN v_commenter_name := 'Someone'; END IF;

    -- 1. Reply to a Comment
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO v_parent_comment_owner_id
        FROM public.comments
        WHERE id = NEW.parent_id;

        -- Don't notify if replying to self
        IF v_parent_comment_owner_id IS NOT NULL AND v_parent_comment_owner_id != NEW.user_id THEN
            PERFORM public.create_notification_if_allowed(
                v_parent_comment_owner_id,
                'comment_reply',
                'New Reply',
                v_commenter_name || ' replied to your comment',
                '/post/' || NEW.post_id || '#comment-' || NEW.id,
                jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'actor_id', NEW.user_id)
            );
        END IF;
    
    -- 2. Comment on a Post
    ELSE
        SELECT user_id INTO v_post_owner_id
        FROM public.posts
        WHERE id = NEW.post_id;

        -- Don't notify if commenting on own post
        IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
            PERFORM public.create_notification_if_allowed(
                v_post_owner_id,
                'feed',
                'New Comment',
                v_commenter_name || ' commented on your post',
                '/post/' || NEW.post_id || '#comment-' || NEW.id,
                jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'actor_id', NEW.user_id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. handle_new_follow_notification (from 20251128_add_notification_triggers.sql)
CREATE OR REPLACE FUNCTION public.handle_new_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_follower_name TEXT;
BEGIN
    SELECT username INTO v_follower_name FROM public.profiles WHERE id = NEW.follower_id;
    IF v_follower_name IS NULL THEN v_follower_name := 'Someone'; END IF;

    PERFORM public.create_notification_if_allowed(
        NEW.following_id,
        'follower',
        'New Follower',
        v_follower_name || ' started following you',
        '/u/' || v_follower_name,
        jsonb_build_object('follower_id', NEW.follower_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. handle_new_reaction_notification (from 20251128_add_notification_triggers.sql)
CREATE OR REPLACE FUNCTION public.handle_new_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_reactor_name TEXT;
BEGIN
    SELECT user_id INTO v_post_owner_id
    FROM public.posts
    WHERE id = NEW.post_id;

    -- Don't notify if liking own post
    IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
        SELECT username INTO v_reactor_name FROM public.profiles WHERE id = NEW.user_id;
        IF v_reactor_name IS NULL THEN v_reactor_name := 'Someone'; END IF;

        PERFORM public.create_notification_if_allowed(
            v_post_owner_id,
            'feed',
            'New Hug',
            v_reactor_name || ' sent you a hug',
            '/post/' || NEW.post_id,
            jsonb_build_object('post_id', NEW.post_id, 'actor_id', NEW.user_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. handle_care_circle_activity (from 20251128_add_notification_triggers.sql)
CREATE OR REPLACE FUNCTION public.handle_care_circle_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_circle_id UUID;
    v_actor_id UUID;
    v_action TEXT;
    v_item_name TEXT;
    v_actor_name TEXT;
    v_member RECORD;
BEGIN
    -- Determine operation type and data source
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        IF TG_TABLE_NAME = 'medications' THEN
            v_circle_id := NEW.circle_id;
            v_actor_id := NEW.user_id;
            v_item_name := NEW.name;
        ELSE
            -- calendar_events: check if circle_id column exists
            BEGIN
                v_circle_id := NEW.circle_id;
            EXCEPTION
                WHEN undefined_column THEN
                    v_circle_id := NULL;
            END;
            v_item_name := NEW.title;
            v_actor_id := NEW.created_by;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'updated';
        IF TG_TABLE_NAME = 'medications' THEN
            v_circle_id := NEW.circle_id;
            v_item_name := NEW.name;
            v_actor_id := NEW.user_id;
        ELSE
            BEGIN
                v_circle_id := NEW.circle_id;
            EXCEPTION
                WHEN undefined_column THEN
                    v_circle_id := NULL;
            END;
            v_item_name := NEW.title;
            v_actor_id := NEW.created_by;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        IF TG_TABLE_NAME = 'medications' THEN
            v_circle_id := OLD.circle_id;
            v_item_name := OLD.name;
            v_actor_id := OLD.user_id;
        ELSE
            BEGIN
                v_circle_id := OLD.circle_id;
            EXCEPTION
                WHEN undefined_column THEN
                    v_circle_id := NULL;
            END;
            v_item_name := OLD.title;
            v_actor_id := OLD.created_by;
        END IF;
    END IF;

    -- Only proceed if it belongs to a circle
    IF v_circle_id IS NOT NULL THEN
        -- Get actor name
        SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = v_actor_id;
        IF v_actor_name IS NULL THEN v_actor_name := 'A member'; END IF;

        -- Notify all OTHER members of the circle
        FOR v_member IN 
            SELECT user_id FROM public.care_circle_members 
            WHERE circle_id = v_circle_id AND user_id != v_actor_id
        LOOP
            PERFORM public.create_notification_if_allowed(
                v_member.user_id,
                'care_circle',
                'Care Circle Update',
                v_actor_name || ' ' || v_action || ' task: ' || v_item_name,
                '/care-circles/' || v_circle_id,
                jsonb_build_object('circle_id', v_circle_id, 'action', v_action, 'item', v_item_name)
            );
        END LOOP;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. handle_task_completion_notification (from 20251129_task_completion_notification_fix_v2.sql)
CREATE OR REPLACE FUNCTION public.handle_task_completion_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_circle_id UUID;
    v_task_name TEXT;
    v_actor_name TEXT;
    v_member RECORD;
BEGIN
    -- 1. Get Task Details (Circle ID and Name)
    -- Check if it's a medication
    IF NEW.medication_id IS NOT NULL THEN
        SELECT circle_id, name INTO v_circle_id, v_task_name
        FROM public.medications
        WHERE id = NEW.medication_id;
    
    -- Check if it's a calendar event
    ELSIF NEW.event_id IS NOT NULL THEN
        SELECT circle_id, title INTO v_circle_id, v_task_name
        FROM public.calendar_events
        WHERE id = NEW.event_id;
    END IF;

    -- 2. Only proceed if it belongs to a circle
    IF v_circle_id IS NOT NULL THEN
        -- Get actor name
        SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = NEW.completed_by;
        IF v_actor_name IS NULL THEN v_actor_name := 'A member'; END IF;

        -- Ensure task name is not null
        IF v_task_name IS NULL OR v_task_name = '' THEN 
            v_task_name := 'Task'; 
        END IF;

        -- 3. Notify all OTHER members of the circle
        FOR v_member IN 
            SELECT user_id FROM public.care_circle_members 
            WHERE circle_id = v_circle_id AND user_id != NEW.completed_by
        LOOP
            PERFORM public.create_notification_if_allowed(
                v_member.user_id,
                'care_circle',
                'Task Completed',
                v_actor_name || ' completed task: ' || v_task_name,
                '/care-circles/' || v_circle_id,
                jsonb_build_object(
                    'circle_id', v_circle_id, 
                    'action', 'completed', 
                    'item', v_task_name,
                    'actor_id', NEW.completed_by,
                    'completion_id', NEW.id
                )
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. delete_own_account (from 20251129_delete_account_function.sql)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID AS $$
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete the user from auth.users
    -- This will cascade to profiles and all related tables
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. get_or_create_conversation (from 20251126_fix_chat_system.sql)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1_id UUID,
    user2_id UUID
) RETURNS UUID AS $$
DECLARE
    existing_conversation_id UUID;
    new_conversation_id UUID;
BEGIN
    -- Check if conversation already exists between these two users
    SELECT cp1.conversation_id INTO existing_conversation_id
    FROM public.conversation_participants cp1
    INNER JOIN public.conversation_participants cp2 
        ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = user1_id
        AND cp2.user_id = user2_id
        AND (
            SELECT count(*) FROM public.conversation_participants
            WHERE conversation_id = cp1.conversation_id
        ) = 2;
    
    IF existing_conversation_id IS NOT NULL THEN
        RETURN existing_conversation_id;
    END IF;
    
    -- Create new conversation
    INSERT INTO public.conversations (created_at, updated_at, last_message_at)
    VALUES (now(), now(), now())
    RETURNING id INTO new_conversation_id;
    
    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES 
        (new_conversation_id, user1_id),
        (new_conversation_id, user2_id);
    
    RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 12. update_conversation_last_message (from 20251126_fix_chat_system.sql)
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = substring(NEW.content, 1, 100),
        updated_at = now()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 13. get_my_conversation_ids (from 20251126_fix_recursion_final.sql)
CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT conversation_id
    FROM public.conversation_participants
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 14. generate_medication_events (from care-tasks-schema.sql)
CREATE OR REPLACE FUNCTION public.generate_medication_events(
    med_id UUID,
    start_date DATE,
    end_date DATE
) RETURNS VOID AS $$
DECLARE
    med_record RECORD;
    med_time TEXT;
    loop_date DATE;
    event_start TIMESTAMPTZ;
BEGIN
    -- Get medication details
    SELECT * INTO med_record FROM public.medications WHERE id = med_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Medication not found';
    END IF;

    -- Loop through each day
    loop_date := start_date;
    WHILE loop_date <= end_date LOOP
        -- Loop through each time for this medication
        FOREACH med_time IN ARRAY med_record.times LOOP
            event_start := (loop_date || ' ' || med_time)::TIMESTAMPTZ;
            
            INSERT INTO public.calendar_events (
                created_by,
                title,
                description,
                start_time,
                end_time,
                event_type,
                task_category,
                medication_id,
                recurrence_pattern
            ) VALUES (
                med_record.user_id,
                med_record.name,
                med_record.dosage || ' - ' || med_record.frequency,
                event_start,
                event_start + interval '30 minutes',
                'medication',
                'medication',
                med_id,
                'daily'
            );
        END LOOP;
        
        loop_date := loop_date + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All 14 functions have been updated with SET search_path = ''
-- This fixes the "function_search_path_mutable" security warnings.
--
-- IMPORTANT: You also need to enable "Leaked Password Protection"
-- in your Supabase Dashboard under Authentication → Settings
-- =====================================================
