-- =====================================================
-- CARE TASKS SYSTEM - Enhanced Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Add new columns to medications table for scheduling
ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS times text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.medications.times IS 'Array of times in HH:MM format, e.g., ["08:00", "12:00", "20:00"]';
COMMENT ON COLUMN public.medications.active IS 'Whether this medication is currently active';
COMMENT ON COLUMN public.medications.user_id IS 'User this medication is for (alternative to circle_id)';

-- 2. Add recurrence and completion tracking to calendar_events
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS recurrence_pattern text,
ADD COLUMN IF NOT EXISTS recurrence_end_date date,
ADD COLUMN IF NOT EXISTS medication_id uuid REFERENCES public.medications(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS completion_notes text,
ADD COLUMN IF NOT EXISTS task_category text DEFAULT 'other';

COMMENT ON COLUMN public.calendar_events.recurrence_pattern IS 'daily, weekly, monthly, or custom RRULE';
COMMENT ON COLUMN public.calendar_events.task_category IS 'medication, personal_care, appointment, task, other';

-- 3. Create task_completions table for detailed logging
CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES public.medications(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  completed_by uuid REFERENCES public.profiles(id),
  scheduled_time timestamptz,
  notes text,
  status text DEFAULT 'completed', -- 'completed', 'skipped', 'late'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_completions_event ON public.task_completions(event_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_medication ON public.task_completions(medication_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON public.task_completions(completed_at);

-- 4. Add RLS policies for task_completions
CREATE POLICY "Users can view their own task completions"
ON public.task_completions FOR SELECT
USING (auth.uid() = completed_by);

CREATE POLICY "Users can insert their own task completions"
ON public.task_completions FOR INSERT
WITH CHECK (auth.uid() = completed_by);

CREATE POLICY "Users can update their own task completions"
ON public.task_completions FOR UPDATE
USING (auth.uid() = completed_by);

-- 5. Add RLS policies for medications (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications' 
    AND policyname = 'Users can view their medications'
  ) THEN
    CREATE POLICY "Users can view their medications"
    ON public.medications FOR SELECT
    USING (
      auth.uid() = user_id 
      OR auth.uid() IN (
        SELECT user_id FROM care_circle_members 
        WHERE circle_id = medications.circle_id
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications' 
    AND policyname = 'Users can insert medications'
  ) THEN
    CREATE POLICY "Users can insert medications"
    ON public.medications FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications' 
    AND policyname = 'Users can update their medications'
  ) THEN
    CREATE POLICY "Users can update their medications"
    ON public.medications FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications' 
    AND policyname = 'Users can delete their medications'
  ) THEN
    CREATE POLICY "Users can delete their medications"
    ON public.medications FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Add RLS policies for calendar_events (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calendar_events' 
    AND policyname = 'Users can view their events'
  ) THEN
    CREATE POLICY "Users can view their events"
    ON public.calendar_events FOR SELECT
    USING (
      auth.uid() = created_by 
      OR auth.uid() = assigned_to
      OR auth.uid() IN (
        SELECT user_id FROM care_circle_members 
        WHERE circle_id = calendar_events.circle_id
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calendar_events' 
    AND policyname = 'Users can insert events'
  ) THEN
    CREATE POLICY "Users can insert events"
    ON public.calendar_events FOR INSERT
    WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calendar_events' 
    AND policyname = 'Users can update their events'
  ) THEN
    CREATE POLICY "Users can update their events"
    ON public.calendar_events FOR UPDATE
    USING (auth.uid() = created_by OR auth.uid() = assigned_to);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calendar_events' 
    AND policyname = 'Users can delete their events'
  ) THEN
    CREATE POLICY "Users can delete their events"
    ON public.calendar_events FOR DELETE
    USING (auth.uid() = created_by);
  END IF;
END $$;

-- 7. Create helper function to generate recurring medication events
CREATE OR REPLACE FUNCTION generate_medication_events(
  med_id uuid,
  start_date date,
  end_date date
) RETURNS void AS $$
DECLARE
  med_record RECORD;
  med_time text;
  loop_date date;
  event_start timestamptz;
BEGIN
  -- Get medication details
  SELECT * INTO med_record FROM medications WHERE id = med_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medication not found';
  END IF;

  -- Loop through each day
  loop_date := start_date;
  WHILE loop_date <= end_date LOOP
    -- Loop through each time for this medication
    FOREACH med_time IN ARRAY med_record.times LOOP
      event_start := (loop_date || ' ' || med_time)::timestamptz;
      
      -- Insert calendar event
      INSERT INTO calendar_events (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this SQL:
-- 1. Medications can have multiple times per day
-- 2. Calendar events track completion status
-- 3. Task completions log detailed history
-- 4. RLS policies ensure data security
-- 5. Helper function generates recurring events
-- =====================================================
