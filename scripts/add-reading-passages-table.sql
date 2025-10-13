-- Create reading_passages table to store reading content
CREATE TABLE IF NOT EXISTS reading_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level TEXT NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
  text TEXT NOT NULL,
  questions JSONB NOT NULL, -- Array of {question, options, correct}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reading_passages ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read passages
CREATE POLICY "Anyone can view reading passages"
  ON reading_passages
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample passages
INSERT INTO reading_passages (title, level, text, questions) VALUES
(
  'The Clever Tortoise',
  'Beginner',
  'Once upon a time, there was a clever tortoise who lived near a big river. All the animals in the forest knew the tortoise was very wise.

One day, the animals had a problem. The river was too wide to cross, and they needed to get to the other side where the best fruit trees grew.

The tortoise thought carefully. Then he had an idea! He asked all the birds to bring stones and drop them in the river. Day by day, the stones piled up until they made a bridge.

All the animals were happy. They could now cross the river safely. The tortoise smiled, knowing that working together made them stronger.',
  '[
    {
      "question": "Where did the tortoise live?",
      "options": ["In a tree", "Near a big river", "In the mountains", "In a cave"],
      "correct": 1
    },
    {
      "question": "What was the animals'' problem?",
      "options": ["They were hungry", "The river was too wide to cross", "They had no water", "They were lost"],
      "correct": 1
    },
    {
      "question": "How did the tortoise solve the problem?",
      "options": ["He swam across", "He built a boat", "He asked birds to bring stones to make a bridge", "He found another path"],
      "correct": 2
    }
  ]'::jsonb
),
(
  'Market Day in Freetown',
  'Intermediate',
  'Every Saturday, the big market in Freetown comes alive with colors, sounds, and delicious smells. Vendors arrange their goods carefully - bright fabrics, fresh vegetables, and handmade crafts.

Mariama helps her mother sell vegetables at the market. She has learned to count money quickly and speak politely to customers. Her favorite part is meeting people from different parts of the city.

Today, a tourist asked Mariama about the best local fruits. She proudly explained about mangoes, pineapples, and sweet oranges. The tourist was impressed by her knowledge and bought a large basket of fruit.

Mariama''s mother smiled. She knew her daughter was learning important skills that would help her in the future. Hard work and good communication were valuable lessons.',
  '[
    {
      "question": "When does the big market happen?",
      "options": ["Every day", "Every Saturday", "Every Sunday", "Once a month"],
      "correct": 1
    },
    {
      "question": "What does Mariama sell at the market?",
      "options": ["Fabrics", "Vegetables", "Crafts", "Fruits only"],
      "correct": 1
    },
    {
      "question": "What skills is Mariama learning?",
      "options": ["Cooking and cleaning", "Reading and writing", "Counting money and communication", "Singing and dancing"],
      "correct": 2
    }
  ]'::jsonb
);
