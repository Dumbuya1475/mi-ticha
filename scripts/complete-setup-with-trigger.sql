-- Complete MiTicha Database Setup with Auto Profile Creation
-- Run this in your Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent',
  full_name TEXT,
  phone_number TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  grade_level TEXT,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_managed BOOLEAN DEFAULT true,
  preferred_avatar TEXT,
  avatar_url TEXT,
  reading_level TEXT,
  daily_study_goal_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- READING PASSAGES TABLE
CREATE TABLE IF NOT EXISTS public.reading_passages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
  grade_level TEXT,
  topic TEXT,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
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

-- ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- READING ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.reading_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES public.reading_passages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  comprehension_score INTEGER,
  words_read INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DAILY STATS TABLE
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  study_time_minutes INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT,
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- PARENT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.parent_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON public.questions(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_activities_student_id ON public.reading_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_student_date ON public.daily_stats(student_id, date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON public.study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_parent_id ON public.parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_reading_passages_difficulty ON public.reading_passages(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_reading_passages_grade ON public.reading_passages(grade_level);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Students policies
DROP POLICY IF EXISTS "Parents can view their students" ON public.students;
CREATE POLICY "Parents can view their students" ON public.students
  FOR SELECT USING (
    parent_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can insert students" ON public.students;
CREATE POLICY "Parents can insert students" ON public.students
  FOR INSERT WITH CHECK (
    parent_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can update their students" ON public.students;
CREATE POLICY "Parents can update their students" ON public.students
  FOR UPDATE USING (
    parent_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
CREATE POLICY "Students can view own profile" ON public.students
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Reading passages - public read
DROP POLICY IF EXISTS "Everyone can view reading passages" ON public.reading_passages;
CREATE POLICY "Everyone can view reading passages" ON public.reading_passages
  FOR SELECT USING (true);

-- Questions policies
DROP POLICY IF EXISTS "Students can view their own questions" ON public.questions;
CREATE POLICY "Students can view their own questions" ON public.questions
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can insert their own questions" ON public.questions;
CREATE POLICY "Students can insert their own questions" ON public.questions
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

-- Answers policies
DROP POLICY IF EXISTS "Students can view answers" ON public.answers;
CREATE POLICY "Students can view answers" ON public.answers
  FOR SELECT USING (
    question_id IN (
      SELECT id FROM public.questions WHERE student_id IN (
        SELECT id FROM public.students WHERE auth_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Students can insert answers" ON public.answers;
CREATE POLICY "Students can insert answers" ON public.answers
  FOR INSERT WITH CHECK (
    question_id IN (
      SELECT id FROM public.questions WHERE student_id IN (
        SELECT id FROM public.students WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Reading activities policies
DROP POLICY IF EXISTS "Students can view their own reading activities" ON public.reading_activities;
CREATE POLICY "Students can view their own reading activities" ON public.reading_activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can insert their own reading activities" ON public.reading_activities;
CREATE POLICY "Students can insert their own reading activities" ON public.reading_activities
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

-- Daily stats policies
DROP POLICY IF EXISTS "Students can view their own stats" ON public.daily_stats;
CREATE POLICY "Students can view their own stats" ON public.daily_stats
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can insert their own stats" ON public.daily_stats;
CREATE POLICY "Students can insert their own stats" ON public.daily_stats
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can update their own stats" ON public.daily_stats;
CREATE POLICY "Students can update their own stats" ON public.daily_stats
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

-- Study sessions policies
DROP POLICY IF EXISTS "Students can view their own sessions" ON public.study_sessions;
CREATE POLICY "Students can view their own sessions" ON public.study_sessions
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can insert their own sessions" ON public.study_sessions;
CREATE POLICY "Students can insert their own sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

-- Parent notifications policies
DROP POLICY IF EXISTS "Parents can view their notifications" ON public.parent_notifications;
CREATE POLICY "Parents can view their notifications" ON public.parent_notifications
  FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update their notifications" ON public.parent_notifications;
CREATE POLICY "Parents can update their notifications" ON public.parent_notifications
  FOR UPDATE USING (parent_id = auth.uid());

-- ============================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- This solves the "Parent profile not found" error
-- ============================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'parent')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DATA: Sample reading passages
INSERT INTO public.reading_passages (title, content, difficulty_level, grade_level, topic, word_count)
SELECT 'The Friendly Cat',
       'There was a cat named Whiskers. Whiskers loved to play with yarn. Every day, she would chase the red ball around the house. Her favorite spot was by the sunny window.',
       'beginner','K-2','Animals',38
WHERE NOT EXISTS (SELECT 1 FROM public.reading_passages WHERE title = 'The Friendly Cat');

INSERT INTO public.reading_passages (title, content, difficulty_level, grade_level, topic, word_count)
SELECT 'A Day at the Beach',
       'Sarah and her family went to the beach. The sand was warm under her feet. She built a big sandcastle with her brother. They found colorful shells by the water. It was a perfect summer day.',
       'beginner','1-3','Family',42
WHERE NOT EXISTS (SELECT 1 FROM public.reading_passages WHERE title = 'A Day at the Beach');

INSERT INTO public.reading_passages (title, content, difficulty_level, grade_level, topic, word_count)
SELECT 'The Solar System',
       'Our solar system has eight planets that orbit around the Sun. Mercury is the closest planet to the Sun, while Neptune is the farthest. Earth is the only planet known to have life. Jupiter is the largest planet in our solar system.',
       'intermediate','3-5','Science',48
WHERE NOT EXISTS (SELECT 1 FROM public.reading_passages WHERE title = 'The Solar System');

INSERT INTO public.reading_passages (title, content, difficulty_level, grade_level, topic, word_count)
SELECT 'The Water Cycle',
       'Water moves in a continuous cycle on Earth. The sun heats water in oceans and lakes, causing it to evaporate into the air. This water vapor rises and cools, forming clouds. When the clouds get heavy, water falls back to Earth as rain or snow.',
       'intermediate','4-6','Science',52
WHERE NOT EXISTS (SELECT 1 FROM public.reading_passages WHERE title = 'The Water Cycle');
