-- Migration: Add task_completions table
-- This table stores completion status for both medication tasks and calendar events.
-- It allows the UI to persist checkmarks and toggle them.

CREATE TABLE IF NOT EXISTS public.task_completions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id uuid REFERENCES public.medications(id) ON DELETE CASCADE,
    event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    completed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_time timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'completed',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ensure at least one of medication_id or calendar_event_id is provided.
ALTER TABLE public.task_completions
    ADD CONSTRAINT task_completion_target_check CHECK (
        (medication_id IS NOT NULL) OR (event_id IS NOT NULL)
    );

-- Indexes for fast lookup by user and target IDs.
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON public.task_completions (completed_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_medication ON public.task_completions (medication_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_event ON public.task_completions (event_id);
