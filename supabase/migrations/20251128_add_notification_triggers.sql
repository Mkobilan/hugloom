-- Migration: Add Notification Triggers
-- Description: Adds database triggers to automatically create notifications for various system events.

-- 1. Generic Function to Insert Notification if Allowed by Settings
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Trigger Functions for Specific Events

-- A. Messages
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
            '/messages', -- Or specific conversation link if available
            jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Comments & Replies
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_parent_comment_owner_id UUID;
    v_commenter_name TEXT;
BEGIN
    -- Get commenter's username (optional, for better message)
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
                'feed', -- Using 'feed' category for post interactions
                'New Comment',
                v_commenter_name || ' commented on your post',
                '/post/' || NEW.post_id || '#comment-' || NEW.id,
                jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'actor_id', NEW.user_id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Follows
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Post Likes (Reactions)
CREATE OR REPLACE FUNCTION public.handle_new_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_reactor_name TEXT;
BEGIN
    -- Only handle post reactions (not comment reactions for now, or add if needed)
    -- Assuming 'reactions' table is for posts. 'comment_reactions' is separate.
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Care Circle Activities (Medications & Calendar Events)
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
            WHERE circle_id = v_circle_id AND user_id != v_actor_id -- Exclude actor (if known)
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

    RETURN NULL; -- Return value ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Attach Triggers

-- Messages
DROP TRIGGER IF EXISTS on_message_created_notify ON public.messages;
CREATE TRIGGER on_message_created_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();

-- Comments
DROP TRIGGER IF EXISTS on_comment_created_notify ON public.comments;
CREATE TRIGGER on_comment_created_notify
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_comment_notification();

-- Follows
DROP TRIGGER IF EXISTS on_follow_created_notify ON public.follows;
CREATE TRIGGER on_follow_created_notify
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_follow_notification();

-- Reactions (Likes)
DROP TRIGGER IF EXISTS on_reaction_created_notify ON public.reactions;
CREATE TRIGGER on_reaction_created_notify
    AFTER INSERT ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_reaction_notification();

-- Care Circle - Medications
DROP TRIGGER IF EXISTS on_medication_change_notify ON public.medications;
CREATE TRIGGER on_medication_change_notify
    AFTER INSERT OR UPDATE OR DELETE ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_care_circle_activity();

-- Care Circle - Calendar Events
DROP TRIGGER IF EXISTS on_calendar_event_change_notify ON public.calendar_events;
CREATE TRIGGER on_calendar_event_change_notify
    AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_care_circle_activity();
