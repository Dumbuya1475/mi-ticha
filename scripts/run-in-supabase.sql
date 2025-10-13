-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR MITICHA APP
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (if any)
-- =====================================================
DROP TABLE IF EXISTS parent_notifications CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS reading_activities CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS reading_passages CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent',
  full_name TEXT,
  phone_number TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STUDENTS TABLE
-- =====================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  grade_level TEXT,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_managed BOOLEAN DEFAULT true,
  preferred_avatar TEXT,
  avatar_url TEXT,
  reading_level TEXT,
  daily_study_goal_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- READING PASSAGES TABLE
-- =====================================================
CREATE TABLE reading_passages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  grade_level TEXT,
  topic TEXT,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  difficulty_level TEXT,
  subject TEXT,
  correct_answer TEXT,
  student_answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANSWERS TABLE
-- =====================================================
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- READING ACTIVITIES TABLE
-- =====================================================
CREATE TABLE reading_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES reading_passages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  comprehension_score INTEGER,
  words_read INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DAILY STATS TABLE
-- =====================================================
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  study_time_minutes INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- =====================================================
-- STUDY SESSIONS TABLE
-- =====================================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT,
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- PARENT NOTIFICATIONS TABLE
-- =====================================================
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_auth_user_id ON students(auth_user_id);
CREATE INDEX idx_questions_student_id ON questions(student_id);
CREATE INDEX idx_reading_activities_student_id ON reading_activities(student_id);
CREATE INDEX idx_daily_stats_student_date ON daily_stats(student_id, date);
CREATE INDEX idx_study_sessions_student_id ON study_sessions(student_id);
CREATE INDEX idx_notifications_parent_id ON parent_notifications(parent_id);
CREATE INDEX idx_reading_passages_difficulty ON reading_passages(difficulty_level);
CREATE INDEX idx_reading_passages_grade ON reading_passages(grade_level);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can view their students" ON students;
DROP POLICY IF EXISTS "Parents can insert students" ON students;
DROP POLICY IF EXISTS "Parents can update their students" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Everyone can view reading passages" ON reading_passages;
DROP POLICY IF EXISTS "Students can view their own questions" ON questions;
DROP POLICY IF EXISTS "Students can insert their own questions" ON questions;
DROP POLICY IF EXISTS "Students can view answers" ON answers;
DROP POLICY IF EXISTS "Students can view their own reading activities" ON reading_activities;
DROP POLICY IF EXISTS "Students can insert their own reading activities" ON reading_activities;
DROP POLICY IF EXISTS "Students can view their own stats" ON daily_stats;
DROP POLICY IF EXISTS "Students can insert their own stats" ON daily_stats;
DROP POLICY IF EXISTS "Students can update their own stats" ON daily_stats;
DROP POLICY IF EXISTS "Students can view their own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Students can insert their own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Parents can view their notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Parents can update their notifications" ON parent_notifications;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Students policies
CREATE POLICY "Parents can view their students" ON students
  FOR SELECT USING (
    parent_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Parents can insert students" ON students
  FOR INSERT WITH CHECK (
    parent_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Parents can update their students" ON students
  FOR UPDATE USING (
    parent_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Students can view own profile" ON students
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Reading passages policies (public read)
CREATE POLICY "Everyone can view reading passages" ON reading_passages
  FOR SELECT USING (true);

-- Questions policies
CREATE POLICY "Students can view their own questions" ON questions
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Students can insert their own questions" ON questions
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

-- Answers policies
CREATE POLICY "Students can view answers" ON answers
  FOR SELECT USING (
    question_id IN (
      SELECT id FROM questions WHERE student_id IN (
        SELECT id FROM students WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Reading activities policies
CREATE POLICY "Students can view their own reading activities" ON reading_activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Students can insert their own reading activities" ON reading_activities
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

-- Daily stats policies
CREATE POLICY "Students can view their own stats" ON daily_stats
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Students can insert their own stats" ON daily_stats
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Students can update their own stats" ON daily_stats
  FOR UPDATE USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

-- Study sessions policies
CREATE POLICY "Students can view their own sessions" ON study_sessions
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Students can insert their own sessions" ON study_sessions
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

-- Parent notifications policies
CREATE POLICY "Parents can view their notifications" ON parent_notifications
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can update their notifications" ON parent_notifications
  FOR UPDATE USING (parent_id = auth.uid());

-- =====================================================
-- SEED DATA: Sample Reading Passages
-- =====================================================
INSERT INTO reading_passages (title, content, difficulty_level, grade_level, topic, word_count) VALUES
('The Friendly Cat', 'There was a cat named Whiskers. Whiskers loved to play with yarn. Every day, she would chase the red ball around the house. Her favorite spot was by the sunny window.', 'beginner', 'K-2', 'Animals', 38),
('A Day at the Beach', 'Sarah and her family went to the beach. The sand was warm under her feet. She built a big sandcastle with her brother. They found colorful shells by the water. It was a perfect summer day.', 'beginner', '1-3', 'Family', 42),
('The Solar System', 'Our solar system has eight planets that orbit around the Sun. Mercury is the closest planet to the Sun, while Neptune is the farthest. Earth is the only planet known to have life. Jupiter is the largest planet in our solar system.', 'intermediate', '3-5', 'Science', 48),
('The Water Cycle', 'Water moves in a continuous cycle on Earth. The sun heats water in oceans and lakes, causing it to evaporate into the air. This water vapor rises and cools, forming clouds. When the clouds get heavy, water falls back to Earth as rain or snow.', 'intermediate', '4-6', 'Science', 52);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables created: profiles, students, reading_passages, questions, answers, reading_activities, daily_stats, study_sessions, parent_notifications';
  RAISE NOTICE 'Sample reading passages added: 4 passages';
END $$;
