-- Complete Database Schema for Miticha App
-- Run this in Supabase SQL Editor
-- This script is idempotent (safe to run multiple times)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent',
  full_name TEXT,
  phone_number TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- STUDENTS TABLE
-- ============================================
DROP TABLE IF EXISTS students CASCADE;

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  grade_level TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_managed BOOLEAN DEFAULT true,
  avatar_url TEXT,
  preferred_avatar TEXT,
  reading_level TEXT,
  daily_study_goal_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children" ON students;
CREATE POLICY "Parents can view their children" ON students
  FOR SELECT USING (
    parent_id = auth.uid() OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Parents can insert children" ON students;
CREATE POLICY "Parents can insert children" ON students
  FOR INSERT WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update their children" ON students;
CREATE POLICY "Parents can update their children" ON students
  FOR UPDATE USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can delete their children" ON students;
CREATE POLICY "Parents can delete their children" ON students
  FOR DELETE USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Students can view own profile" ON students;
CREATE POLICY "Students can view own profile" ON students
  FOR SELECT USING (auth_user_id = auth.uid());

-- ============================================
-- QUESTIONS TABLE
-- ============================================
DROP TABLE IF EXISTS questions CASCADE;

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN,
  difficulty TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children's questions" ON questions;
CREATE POLICY "Parents can view their children's questions" ON questions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view their own questions" ON questions;
CREATE POLICY "Students can view their own questions" ON questions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert their own questions" ON questions;
CREATE POLICY "Students can insert their own questions" ON questions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- WORDS LEARNED TABLE
-- ============================================
DROP TABLE IF EXISTS words_learned CASCADE;

CREATE TABLE words_learned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  pronunciation TEXT,
  times_reviewed INTEGER DEFAULT 1,
  mastered BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (student_id, word)
);

CREATE INDEX IF NOT EXISTS idx_words_student ON words_learned(student_id);
CREATE INDEX IF NOT EXISTS idx_words_mastered ON words_learned(mastered);

ALTER TABLE words_learned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view word progress" ON words_learned;
CREATE POLICY "Parents can view word progress" ON words_learned
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
    OR student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can manage their words" ON words_learned;
CREATE POLICY "Students can manage their words" ON words_learned
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- WORD LEARNING SESSIONS
-- ============================================
DROP TABLE IF EXISTS word_learning_sessions CASCADE;

CREATE TABLE word_learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_sessions_student ON word_learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_word_sessions_created ON word_learning_sessions(created_at DESC);

ALTER TABLE word_learning_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view word sessions" ON word_learning_sessions;
CREATE POLICY "Parents can view word sessions" ON word_learning_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
    OR student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert word sessions" ON word_learning_sessions;
CREATE POLICY "Students can insert word sessions" ON word_learning_sessions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- STUDY SESSIONS TABLE
-- ============================================
DROP TABLE IF EXISTS study_sessions CASCADE;

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for study_sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children's sessions" ON study_sessions;
CREATE POLICY "Parents can view their children's sessions" ON study_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own sessions" ON study_sessions;
CREATE POLICY "Students can view own sessions" ON study_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert own sessions" ON study_sessions;
CREATE POLICY "Students can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can update own sessions" ON study_sessions;
CREATE POLICY "Students can update own sessions" ON study_sessions
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- DAILY STATS TABLE
-- ============================================
DROP TABLE IF EXISTS daily_stats CASCADE;

CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  study_minutes INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  subjects_studied TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- RLS for daily_stats
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children's stats" ON daily_stats;
CREATE POLICY "Parents can view their children's stats" ON daily_stats
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own stats" ON daily_stats;
CREATE POLICY "Students can view own stats" ON daily_stats
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert own stats" ON daily_stats;
CREATE POLICY "Students can insert own stats" ON daily_stats
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can update own stats" ON daily_stats;
CREATE POLICY "Students can update own stats" ON daily_stats
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- READING ACTIVITIES TABLE
-- ============================================
DROP TABLE IF EXISTS reading_activities CASCADE;

CREATE TABLE reading_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  pages_read INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  comprehension_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for reading_activities
ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children's reading" ON reading_activities;
CREATE POLICY "Parents can view their children's reading" ON reading_activities
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own reading" ON reading_activities;
CREATE POLICY "Students can view own reading" ON reading_activities
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert own reading" ON reading_activities;
CREATE POLICY "Students can insert own reading" ON reading_activities
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- PARENT NOTIFICATIONS TABLE
-- ============================================
DROP TABLE IF EXISTS parent_notifications CASCADE;

CREATE TABLE parent_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for parent_notifications
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view own notifications" ON parent_notifications;
CREATE POLICY "Parents can view own notifications" ON parent_notifications
  FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update own notifications" ON parent_notifications;
CREATE POLICY "Parents can update own notifications" ON parent_notifications
  FOR UPDATE USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON parent_notifications;
CREATE POLICY "System can insert notifications" ON parent_notifications
  FOR INSERT WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON questions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_student_id ON daily_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_reading_activities_student_id ON reading_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent_id ON parent_notifications(parent_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - comment out if not needed)
-- ============================================

-- Note: You'll need to create actual auth users first
-- This is just to show the structure

-- INSERT INTO profiles (id, role, full_name, phone_number)
-- VALUES 
--   ('your-parent-auth-uuid-here', 'parent', 'John Doe', '+1234567890');

-- INSERT INTO students (name, age, grade_level, parent_id, auth_user_id, is_managed)
-- VALUES 
--   ('Emma Doe', 8, '3rd Grade', 'your-parent-auth-uuid-here', 'child-auth-uuid-here', true);
