-- Migration v3: Switch to unified Supabase Auth for students
-- This updates the students table to use auth_user_id instead of pin_hash

-- Add auth_user_id column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT true;

-- Remove pin_hash column (no longer needed)
ALTER TABLE students 
DROP COLUMN IF EXISTS pin_hash;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);

-- Update RLS policies for students table
DROP POLICY IF EXISTS "Parents can view their own students" ON students;
DROP POLICY IF EXISTS "Parents can insert their own students" ON students;
DROP POLICY IF EXISTS "Parents can update their own students" ON students;
DROP POLICY IF EXISTS "Parents can delete their own students" ON students;
DROP POLICY IF EXISTS "Students can view their own profile" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;

-- Fixed RLS policies to use profiles.id instead of profiles.auth_user_id
-- profiles.id IS the auth user id (references auth.users directly)

-- Parents can view their own students
CREATE POLICY "Parents can view their own students"
ON students FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Parents can insert students
CREATE POLICY "Parents can insert their own students"
ON students FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

-- Parents can update their own students
CREATE POLICY "Parents can update their own students"
ON students FOR UPDATE
TO authenticated
USING (parent_id = auth.uid());

-- Parents can delete their own students
CREATE POLICY "Parents can delete their own students"
ON students FOR DELETE
TO authenticated
USING (parent_id = auth.uid());

-- Students can view their own profile
CREATE POLICY "Students can view their own profile"
ON students FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Students can update their own profile (limited fields)
CREATE POLICY "Students can update their own profile"
ON students FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Update other tables to ensure proper RLS
-- Questions table
DROP POLICY IF EXISTS "Students can view their own questions" ON questions;
DROP POLICY IF EXISTS "Students can insert questions" ON questions;
DROP POLICY IF EXISTS "Students can view own questions" ON questions;

CREATE POLICY "Students can view their own questions"
ON questions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
  OR
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "Students can insert their own questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Answers table
DROP POLICY IF EXISTS "Users can view answers to their questions" ON answers;
DROP POLICY IF EXISTS "Users can insert answers" ON answers;
DROP POLICY IF EXISTS "Users can update answer feedback" ON answers;

CREATE POLICY "Users can view answers"
ON answers FOR SELECT
TO authenticated
USING (
  question_id IN (
    SELECT q.id FROM questions q
    JOIN students s ON q.student_id = s.id
    WHERE s.auth_user_id = auth.uid() OR s.parent_id = auth.uid()
  )
);

CREATE POLICY "Users can insert answers"
ON answers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update answer feedback"
ON answers FOR UPDATE
TO authenticated
USING (
  question_id IN (
    SELECT q.id FROM questions q
    JOIN students s ON q.student_id = s.id
    WHERE s.auth_user_id = auth.uid() OR s.parent_id = auth.uid()
  )
);

-- Reading activities table
DROP POLICY IF EXISTS "Students can view their own reading activities" ON reading_activities;
DROP POLICY IF EXISTS "Users can view own reading" ON reading_activities;
DROP POLICY IF EXISTS "Users can manage own reading" ON reading_activities;

CREATE POLICY "Students can view their own reading activities"
ON reading_activities FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid() OR parent_id = auth.uid()
  )
);

CREATE POLICY "Students can manage their own reading activities"
ON reading_activities FOR ALL
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Study sessions table
DROP POLICY IF EXISTS "Students can view their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON study_sessions;

CREATE POLICY "Students can view their own study sessions"
ON study_sessions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid() OR parent_id = auth.uid()
  )
);

CREATE POLICY "Students can manage their own study sessions"
ON study_sessions FOR ALL
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Daily stats table
DROP POLICY IF EXISTS "Students can view their own daily stats" ON daily_stats;
DROP POLICY IF EXISTS "Users can view own stats" ON daily_stats;
DROP POLICY IF EXISTS "Users can manage own stats" ON daily_stats;

CREATE POLICY "Students can view their own daily stats"
ON daily_stats FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid() OR parent_id = auth.uid()
  )
);

CREATE POLICY "Students can manage their own daily stats"
ON daily_stats FOR ALL
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Words learned table
DROP POLICY IF EXISTS "Users can view own words" ON words_learned;
DROP POLICY IF EXISTS "Users can manage own words" ON words_learned;

CREATE POLICY "Students can view their own words"
ON words_learned FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid() OR parent_id = auth.uid()
  )
);

CREATE POLICY "Students can manage their own words"
ON words_learned FOR ALL
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  )
);

-- Parent notifications - parents can view their own notifications
DROP POLICY IF EXISTS "Parents can view their own notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Parents can update their own notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Parents can view own notifications" ON parent_notifications;

CREATE POLICY "Parents can view their own notifications"
ON parent_notifications FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Parents can update their own notifications (mark as read)
CREATE POLICY "Parents can update their own notifications"
ON parent_notifications FOR UPDATE
TO authenticated
USING (parent_id = auth.uid());

-- Remove the public policy for viewing student names (no longer needed)
DROP POLICY IF EXISTS "Public can view student names" ON students;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ MI TICHA DATABASE V3 MIGRATION COMPLETE!';
  RAISE NOTICE '🔐 Switched to unified Supabase Auth for students';
  RAISE NOTICE '📊 Updated all RLS policies';
  RAISE NOTICE '🚀 Students now use full Supabase authentication!';
END $$;
