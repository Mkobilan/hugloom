-- Migration: Add Task Completion Notification Trigger
-- Description: Adds a trigger to notify Care Circle members when a task is completed.

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
    ELSIF NEW.calendar_event_id IS NOT NULL THEN
        SELECT circle_id, title INTO v_circle_id, v_task_name
        FROM public.calendar_events
        WHERE id = NEW.calendar_event_id;
    END IF;

    -- 2. Only proceed if it belongs to a circle
    IF v_circle_id IS NOT NULL THEN
        -- Get actor name
        SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = NEW.completed_by;
        IF v_actor_name IS NULL THEN v_actor_name := 'A member'; END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Trigger
DROP TRIGGER IF EXISTS on_task_completed_notify ON public.task_completions;
CREATE TRIGGER on_task_completed_notify
    AFTER INSERT ON public.task_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_completion_notification();
