-- Additional tables for word learning and math activities
-- Run this after the main schema in your Supabase SQL Editor

-- WORD LEARNING ACTIVITIES
CREATE TABLE IF NOT EXISTS public.word_learning_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  learned BOOLEAN DEFAULT FALSE,
  pronunciation TEXT,
  definition TEXT,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- MATH ACTIVITIES
CREATE TABLE IF NOT EXISTS public.math_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  problem_text TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  difficulty_level TEXT,
  student_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  steps_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_word_learning_student_id ON public.word_learning_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_math_activities_student_id ON public.math_activities(student_id);

-- ENABLE RLS
ALTER TABLE public.word_learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.math_activities ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Students can view their own word activities" ON public.word_learning_activities;
CREATE POLICY "Students can view their own word activities" ON public.word_learning_activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can insert their own word activities" ON public.word_learning_activities;
CREATE POLICY "Students can insert their own word activities" ON public.word_learning_activities
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can update their own word activities" ON public.word_learning_activities;
CREATE POLICY "Students can update their own word activities" ON public.word_learning_activities
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can view their own math activities" ON public.math_activities;
CREATE POLICY "Students can view their own math activities" ON public.math_activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can insert their own math activities" ON public.math_activities;
CREATE POLICY "Students can insert their own math activities" ON public.math_activities
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can view their children's word activities" ON public.word_learning_activities;
CREATE POLICY "Parents can view their children's word activities" ON public.word_learning_activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can view their children's math activities" ON public.math_activities;
CREATE POLICY "Parents can view their children's math activities" ON public.math_activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid())
  );
