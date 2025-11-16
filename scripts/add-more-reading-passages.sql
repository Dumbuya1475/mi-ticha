-- Add more diverse and engaging reading passages for children

-- Additional reading passages for various levels
INSERT INTO reading_passages (title, difficulty_level, text, questions, created_at)
VALUES
(
  'The Magic Drum',
  'easy',
  'In a small village, there was a magic drum. When you hit the drum once, it gave you rice. When you hit it twice, it gave you water. When you hit it three times, it gave you fruit.

One day, a greedy man took the drum to his house. He hit it many times! Rice, water, and fruit poured out everywhere. Soon his house was full.

The greedy man could not stop the drum. He called for help. The village chief came and hit the drum four times. Everything stopped and went back into the drum.

The chief said, "The magic drum is for sharing, not for being greedy." From that day, the drum stayed with the chief, and he shared its gifts with everyone.',
  '[
    {
      "question": "What happened when you hit the drum once?",
      "options": ["It gave water", "It gave rice", "It gave fruit", "Nothing happened"],
      "correct": 1
    },
    {
      "question": "Why did the greedy man have a problem?",
      "options": ["The drum was broken", "He hit it too many times", "He lost the drum", "The chief took it away"],
      "correct": 1
    },
    {
      "question": "What lesson did the story teach?",
      "options": ["Drums are magical", "Sharing is better than being greedy", "Rice is important", "Chiefs are wise"],
      "correct": 1
    }
  ]'::jsonb,
  NOW()
),
(
  'The Brave Little Bird',
  'easy',
  'A little bird lived in a big tree near the river. One day, she saw a fire starting in the forest. All the big animals ran away, but the little bird did not run.

She flew to the river and took water in her beak. She flew back and dropped the water on the fire. Again and again, she flew to the river and back.

A big elephant saw her and laughed. "Little bird, you are too small! You cannot stop this fire!"

The little bird said, "I may be small, but I must try." Her courage made the other animals feel ashamed. They all came back to help. Together, they put out the fire and saved the forest.',
  '[
    {
      "question": "What did the little bird do when she saw the fire?",
      "options": ["She ran away", "She called for help", "She carried water to fight the fire", "She flew to another forest"],
      "correct": 2
    },
    {
      "question": "Why did the elephant laugh at the bird?",
      "options": ["The bird was funny", "The bird was too small", "The bird was wet", "The bird was scared"],
      "correct": 1
    },
    {
      "question": "What made the other animals come back to help?",
      "options": ["The elephant told them to", "They saw the little bird trying so hard", "The fire got bigger", "They were not really gone"],
      "correct": 1
    }
  ]'::jsonb,
  NOW()
),
(
  'Amina Goes to School',
  'intermediate',
  'Amina woke up excited. Today was her first day at the new school in town. Her mother had prepared her uniform the night before - a blue dress with a white collar.

At school, Amina felt nervous. Everything was different from her village school. The classrooms had many desks, and there were books everywhere. Her teacher, Miss Kamara, smiled warmly and introduced her to the class.

During break time, a girl named Fatu came to talk to her. "I am new too," Fatu said. "I moved here last month. Would you like to be my friend?" Amina smiled with relief.

Together, they explored the school playground and met other children. By the end of the day, Amina could not wait to come back tomorrow. She had learned that new beginnings can be exciting when you open your heart to friendship.',
  '[
    {
      "question": "How did Amina feel on her first day?",
      "options": ["Only excited", "Excited and then nervous", "Angry and sad", "Bored"],
      "correct": 1
    },
    {
      "question": "Who helped Amina feel better at school?",
      "options": ["Her mother", "Miss Kamara only", "Fatu, a new friend", "The principal"],
      "correct": 2
    },
    {
      "question": "What was different about the new school?",
      "options": ["It had no teachers", "It had many desks and books", "It was in a village", "It had no playground"],
      "correct": 1
    },
    {
      "question": "What lesson did Amina learn?",
      "options": ["Schools are scary", "New beginnings can be good with friendship", "Village schools are better", "Books are heavy"],
      "correct": 1
    }
  ]'::jsonb,
  NOW()
),
(
  'The Helpful Farmers',
  'intermediate',
  'In a farming village, there lived two farmers: Mr. Kamara and Mr. Sesay. Mr. Kamara grew rice, while Mr. Sesay grew vegetables. They were neighbors but never talked to each other.

One year, there was very little rain. Mr. Kamara''s rice was dying. He tried everything, but nothing worked. Meanwhile, Mr. Sesay''s vegetables also struggled without water.

One morning, Mr. Sesay saw Mr. Kamara looking sad. He walked over and asked, "What is wrong, neighbor?" Mr. Kamara explained his problem. Mr. Sesay thought for a moment, then said, "I have an idea. Let us work together."

They decided to dig a channel from the distant stream to their farms. Working together, they finished in three days. The water flowed to both farms. That year, both farmers had good harvests. They learned that cooperation brings better results than working alone.',
  '[
    {
      "question": "What problem did both farmers face?",
      "options": ["Too much rain", "Not enough rain", "Too many pests", "Broken tools"],
      "correct": 1
    },
    {
      "question": "What crop did Mr. Kamara grow?",
      "options": ["Vegetables", "Rice", "Fruit", "Cassava"],
      "correct": 1
    },
    {
      "question": "How did the farmers solve their problem?",
      "options": ["They bought water", "They moved away", "They dug a channel together", "They waited for rain"],
      "correct": 2
    },
    {
      "question": "What is the main lesson of this story?",
      "options": ["Farming is hard", "Working together is better than working alone", "Rice needs water", "Neighbors should not talk"],
      "correct": 1
    }
  ]'::jsonb,
  NOW()
),
(
  'The Wise Spider and the Contest',
  'hard',
  'Long ago, all the animals decided to hold a contest to see who was the wisest. The lion, the elephant, and the monkey all boasted about their intelligence. But a small spider named Anansi quietly joined the competition.

The contest required each animal to solve three impossible riddles. The mighty lion roared but could not answer even one riddle. The clever monkey scratched his head in confusion. Even the wise elephant could not figure out the answers.

When Anansi''s turn came, he listened carefully to each riddle. He thought deeply, using not just his brain but also his experience and creativity. One by one, he solved all three riddles. The animals were amazed!

The king announced Anansi as the winner and said, "True wisdom is not about being the biggest or the strongest. It comes from careful thinking, listening well, and learning from life''s experiences. Size does not determine intelligence."

From that day forward, Anansi became known as the wisest of all creatures, proving that wisdom can come in the smallest packages.',
  '[
    {
      "question": "What was the purpose of the contest?",
      "options": ["To find the strongest animal", "To find the wisest animal", "To find the fastest animal", "To find the biggest animal"],
      "correct": 1
    },
    {
      "question": "Why could the lion, monkey, and elephant not solve the riddles?",
      "options": ["The riddles were too easy", "They did not try hard enough", "They relied on strength rather than careful thinking", "They did not want to win"],
      "correct": 2
    },
    {
      "question": "What qualities helped Anansi win the contest?",
      "options": ["His size and strength", "His loud voice", "Careful thinking, listening, and life experience", "His friendship with the king"],
      "correct": 2
    },
    {
      "question": "What is the main message of this story?",
      "options": ["Spiders are always wise", "True wisdom comes from thoughtful reflection, not physical power", "Contests are important", "Lions are not intelligent"],
      "correct": 1
    },
    {
      "question": "What does the phrase wisdom can come in the smallest packages mean?",
      "options": ["Small boxes contain wisdom", "Size does not determine intelligence", "Small animals are better", "Packages are wise"],
      "correct": 1
    }
  ]'::jsonb,
  NOW()
),
(
  'Journey Through the Diamond Mountains',
  'hard',
  'The Diamond Mountains of Sierra Leone are known for their breathtaking beauty and rich history. These mountains, covered with lush green forests, have been home to diverse wildlife and local communities for centuries.

Scientists believe that millions of years ago, volcanic activity formed these mountains. Over time, erosion carved valleys and created rivers that flow through the landscape. The mountains earned their name from the minerals found in the region, including diamonds, which have significantly impacted the country''s economy.

Local communities have developed sustainable ways of living in harmony with nature. They practice traditional farming on the mountain slopes, growing crops like coffee and cocoa. The communities also protect the forests, understanding that these ecosystems provide clean water, prevent soil erosion, and maintain biodiversity.

In recent years, efforts to promote eco-tourism have brought visitors who want to experience the mountains'' natural beauty. This has created new opportunities for local people while encouraging conservation. However, challenges remain in balancing economic development with environmental protection.

The Diamond Mountains represent both Sierra Leone''s natural wealth and the importance of preserving our environment for future generations. They remind us that our relationship with nature requires respect, understanding, and responsible stewardship.',
  '[
    {
      "question": "How were the Diamond Mountains formed?",
      "options": ["By human construction", "By volcanic activity millions of years ago", "By earthquakes last century", "By diamond mining"],
      "correct": 1
    },
    {
      "question": "Why are they called the Diamond Mountains?",
      "options": ["They look like diamonds", "Minerals including diamonds are found there", "Diamonds grow on trees there", "A king named them"],
      "correct": 1
    },
    {
      "question": "What crops do local communities grow on the mountain slopes?",
      "options": ["Rice and wheat", "Coffee and cocoa", "Corn and beans", "Bananas and plantains"],
      "correct": 1
    },
    {
      "question": "Why do local communities protect the forests?",
      "options": ["The government forces them to", "Forests provide water, prevent erosion, and maintain biodiversity", "They worship the trees", "To hide diamonds"],
      "correct": 1
    },
    {
      "question": "What challenge is mentioned regarding the Diamond Mountains?",
      "options": ["Too many tourists", "Balancing economic development with environmental protection", "Not enough diamonds", "No roads to access them"],
      "correct": 1
    },
    {
      "question": "What does responsible stewardship mean in the context of this passage?",
      "options": ["Owning the mountains", "Taking care of nature wisely for the future", "Mining all the diamonds", "Building more hotels"],
      "correct": 1
    }
  ]'::jsonb,
  NOW()
);
