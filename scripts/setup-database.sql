-- MI TICHA DATABASE SCHEMA
-- Created by Mohamed Super Dumbuya
-- Copy this ENTIRE file and paste into Supabase SQL Editor

-- ============================================
-- TABLE 1: PROFILES (Parent/Guardian accounts)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent', 'guardian', 'sibling')),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- TABLE 2: STUDENTS (Children who learn)
-- ============================================
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  grade_level TEXT,
  reading_level TEXT CHECK (reading_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  daily_study_goal_minutes INTEGER DEFAULT 30,
  preferred_avatar TEXT DEFAULT 'moe',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_students_parent ON students(parent_id);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own students" ON students
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can manage own students" ON students
  FOR ALL USING (parent_id = auth.uid());

-- ============================================
-- TABLE 3: QUESTIONS (All questions asked)
-- ============================================
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('word', 'math', 'science', 'other')),
  input_method TEXT CHECK (input_method IN ('text', 'voice')),
  avatar_used TEXT DEFAULT 'moe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_student ON questions(student_id);
CREATE INDEX idx_questions_created ON questions(created_at DESC);
CREATE INDEX idx_questions_type ON questions(question_type);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own questions" ON questions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert questions" ON questions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 4: ANSWERS (AI responses)
-- ============================================
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  explanation TEXT,
  was_helpful BOOLEAN DEFAULT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_answers_question ON answers(question_id);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view answers to their questions" ON answers
  FOR SELECT USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN students s ON q.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert answers" ON answers
  FOR INSERT WITH CHECK (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN students s ON q.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can update answer feedback" ON answers
  FOR UPDATE USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN students s ON q.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 5: WORDS_LEARNED (Vocabulary tracking)
-- ============================================
CREATE TABLE words_learned (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  pronunciation TEXT,
  times_reviewed INTEGER DEFAULT 1,
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, word)
);

CREATE INDEX idx_words_student ON words_learned(student_id);
CREATE INDEX idx_words_mastered ON words_learned(mastered);

ALTER TABLE words_learned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own words" ON words_learned
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own words" ON words_learned
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 6: DAILY_STATS (Progress tracking)
-- ============================================
CREATE TABLE daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_asked INTEGER DEFAULT 0,
  words_learned INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  study_goal_met BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, date)
);

CREATE INDEX idx_stats_student_date ON daily_stats(student_id, date DESC);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON daily_stats
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own stats" ON daily_stats
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 7: STUDY_SESSIONS (Time tracking)
-- ============================================
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  goal_met BOOLEAN DEFAULT FALSE,
  parent_notified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_student ON study_sessions(student_id);
CREATE INDEX idx_sessions_started ON study_sessions(started_at DESC);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own sessions" ON study_sessions
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 8: READING_ACTIVITIES (Reading practice)
-- ============================================
CREATE TABLE reading_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  passage_text TEXT NOT NULL,
  passage_difficulty TEXT CHECK (passage_difficulty IN ('easy', 'medium', 'hard')),
  word_count INTEGER,
  time_taken_seconds INTEGER,
  reading_speed_wpm DECIMAL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reading_student ON reading_activities(student_id);

ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading" ON reading_activities
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own reading" ON reading_activities
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- ============================================
-- TABLE 9: PARENT_NOTIFICATIONS
-- ============================================
CREATE TABLE parent_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('session_start', 'session_end', 'goal_achieved', 'goal_not_met', 'milestone')),
  message TEXT NOT NULL,
  sent_via TEXT CHECK (sent_via IN ('app', 'sms', 'both')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notifications_parent ON parent_notifications(parent_id, sent_at DESC);

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own notifications" ON parent_notifications
  FOR SELECT USING (auth.uid() = parent_id);

-- ============================================
-- FUNCTIONS: Auto-update daily stats
-- ============================================
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (student_id, date, questions_asked)
  VALUES (NEW.student_id, CURRENT_DATE, 1)
  ON CONFLICT (student_id, date) 
  DO UPDATE SET questions_asked = daily_stats.questions_asked + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stats
AFTER INSERT ON questions
FOR EACH ROW
EXECUTE FUNCTION update_daily_stats();

-- ============================================
-- FUNCTION: Calculate reading speed
-- ============================================
CREATE OR REPLACE FUNCTION calculate_reading_speed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND NEW.time_taken_seconds > 0 AND NEW.word_count > 0 THEN
    NEW.reading_speed_wpm := ROUND((NEW.word_count::DECIMAL / NEW.time_taken_seconds) * 60, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_reading_speed
BEFORE UPDATE ON reading_activities
FOR EACH ROW
EXECUTE FUNCTION calculate_reading_speed();

-- ============================================
-- VIEWS: Useful queries
-- ============================================

-- Student Progress Summary
CREATE VIEW student_progress AS
SELECT 
  s.id as student_id,
  s.name,
  s.age,
  s.preferred_avatar,
  COUNT(DISTINCT q.id) as total_questions,
  COUNT(DISTINCT wl.id) as total_words_learned,
  COALESCE(SUM(ds.time_spent_minutes), 0) as total_time_minutes,
  MAX(q.created_at) as last_active
FROM students s
LEFT JOIN questions q ON s.id = q.student_id
LEFT JOIN words_learned wl ON s.id = wl.student_id
LEFT JOIN daily_stats ds ON s.id = ds.student_id
GROUP BY s.id, s.name, s.age, s.preferred_avatar;

-- Weekly Activity
CREATE VIEW weekly_activity AS
SELECT 
  student_id,
  date,
  questions_asked,
  words_learned,
  problems_solved,
  time_spent_minutes,
  study_goal_met
FROM daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY student_id, date DESC;

-- ============================================
-- SEED DATA: Avatar Information
-- ============================================
CREATE TABLE avatars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  personality TEXT NOT NULL,
  description TEXT NOT NULL,
  voice_style TEXT,
  best_for TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO avatars (id, name, gender, personality, description, voice_style, best_for) VALUES
('moe', 'Moe', 'male', 'Patient, step-by-step, like a big brother', 'Based on Mohamed - explains things carefully and encourages you to try', 'Calm and encouraging', 'Students who want detailed explanations'),
('fatmata', 'Fatmata', 'female', 'Encouraging, nurturing, supportive', 'Like a favorite aunt - warm and makes you feel confident', 'Warm and supportive', 'Students who need confidence boost'),
('kamara', 'Mr. Kamara', 'male', 'Structured, disciplined, traditional teacher', 'Firm but fair - keeps you focused on learning', 'Firm but caring', 'Students who need structure'),
('sesay', 'Miss Sesay', 'female', 'Fun, relatable, like an older sister', 'Makes learning cool and exciting', 'Energetic and friendly', 'Teenagers who think school is boring');

ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view avatars" ON avatars
  FOR SELECT USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ MI TICHA DATABASE SETUP COMPLETE!';
  RAISE NOTICE '📊 Created 9 tables + 2 views + 4 avatars';
  RAISE NOTICE '🚀 Ready to build!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created by: Mohamed Super Dumbuya';
  RAISE NOTICE 'Location: Lungi, Sierra Leone';
  RAISE NOTICE 'Project: Mi Ticha - Every Child Deserves a Teacher';
END $$;
