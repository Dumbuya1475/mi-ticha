import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { word, studentId } = await request.json()

    if (!word || !studentId) {
      return NextResponse.json({ error: "Missing word or studentId" }, { status: 400 })
    }

    const cleanWord = word.trim().toLowerCase()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const wordDetails = {
      word: cleanWord,
      pronunciation: generatePronunciation(cleanWord),
      definition: generateDefinition(cleanWord),
      simpleDefinition: generateSimpleDefinition(cleanWord),
      example: generateExample(cleanWord),
      memoryTip: generateMemoryTip(cleanWord),
      relatedWords: getRelatedWords(cleanWord),
      difficulty: determineDifficulty(cleanWord),
      image: getEmojiForWord(cleanWord),
    }

    const { error: insertError } = await supabase.from("word_learning_activities").insert({
      student_id: studentId,
      word: cleanWord,
      learned: false,
      pronunciation: wordDetails.pronunciation,
      definition: wordDetails.definition,
      example: wordDetails.example,
    })

    if (insertError) {
      console.error("[v0] Error logging word activity:", insertError)
      return NextResponse.json(
        { error: "Failed to save word learning activity. Please make sure you've set up the database tables in your Supabase dashboard." },
        { status: 500 }
      )
    }

    return NextResponse.json({ wordDetails })
  } catch (error) {
    console.error("[v0] Error in learn-word API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generatePronunciation(word: string): string {
  const vowels = /[aeiou]/gi
  const syllables = word.match(/[^aeiou]*[aeiou]+/gi) || [word]
  return syllables.join("-")
}

function generateDefinition(word: string): string {
  const commonDefinitions: { [key: string]: string } = {
    cat: "A small furry animal that people often keep as a pet. Cats have sharp claws, whiskers, and usually say 'meow'.",
    dog: "A friendly animal that people keep as a pet. Dogs are loyal companions who wag their tails when they're happy and like to play.",
    tree: "A large plant with a wooden trunk and branches covered with leaves. Trees grow tall over many years and provide shade and homes for animals.",
    water: "A clear liquid that falls from the sky as rain and fills rivers, lakes, and oceans. All living things need water to survive.",
    sun: "The bright star in the sky that gives us light and warmth during the day. The sun is so bright that we should never look directly at it.",
    book: "A set of written or printed pages fastened together inside covers. Books contain stories, information, or pictures that we can read and learn from.",
    apple: "A round fruit that grows on trees. Apples can be red, green, or yellow and taste sweet or sometimes a bit sour.",
    flower: "The colorful part of a plant that often smells nice. Flowers come in many shapes and colors and can grow in gardens or wild places.",
    star: "A tiny bright point of light you see in the night sky. Stars are actually huge balls of burning gas very far away from Earth.",
    heart: "The organ inside your chest that pumps blood through your body. We also use the word heart to talk about love and feelings.",
  }

  return (
    commonDefinitions[word] ||
    `${capitalizeFirst(word)} is an interesting word that represents an important concept. It refers to something you might encounter in everyday life or in your studies.`
  )
}

function generateSimpleDefinition(word: string): string {
  const simpleDefinitions: { [key: string]: string } = {
    cat: "A small furry pet animal that says meow",
    dog: "A friendly pet animal that barks and wags its tail",
    tree: "A big plant with a trunk and branches",
    water: "The liquid we drink to stay alive",
    sun: "The bright ball of light in the sky during the day",
    book: "Pages with words and pictures to read",
    apple: "A round fruit that grows on trees",
    flower: "The pretty, colorful part of a plant",
    star: "A tiny bright light in the night sky",
    heart: "The part of your body that pumps blood",
  }

  return simpleDefinitions[word] || `${capitalizeFirst(word)} - a word that describes something you can learn about`
}

function generateExample(word: string): string {
  const examples: { [key: string]: string } = {
    cat: "My cat loves to sleep in the warm sunshine by the window.",
    dog: "The dog wagged its tail happily when its owner came home from school.",
    tree: "We sat under the big mango tree to stay cool on a hot afternoon.",
    water: "After playing football, I drank a glass of cold water.",
    sun: "The sun rises in the east every morning and sets in the west.",
    book: "I read an exciting book about adventures in the forest.",
    apple: "She picked a ripe red apple from the tree and took a bite.",
    flower: "The beautiful flower smelled sweet and attracted colorful butterflies.",
    star: "At night, we looked up and counted the twinkling stars in the sky.",
    heart: "When I exercise, I can feel my heart beating faster in my chest.",
  }

  return examples[word] || `I learned the word "${word}" today, and now I can use it in my writing.`
}

function generateMemoryTip(word: string): string {
  const tips: { [key: string]: string } = {
    cat: "Think of a CAT wearing a CAP - both start with 'ca' and cats are curious creatures!",
    dog: "DOG spelled backwards is GOD - dogs are man's best friend and very loyal!",
    tree: "Remember: Trees have THREE main parts - roots, trunk, and branches!",
    water: "WATER starts with 'W' like WAVE - water makes waves in the ocean!",
    sun: "The SUN is like a big yellow ball - and SUN rhymes with FUN because sunny days are fun!",
    book: "A BOOK has two O's in the middle, like the two covers that hold the pages!",
    apple: "An APPLE a day keeps the doctor away - a famous saying to help you remember!",
    flower: "FLOWER has the word FLOW in it - flowers flow in the breeze!",
    star: "STAR starts with ST like STAY - stars stay in the sky at night!",
    heart: "Your HEART is at the center of your chest, just like it's at the center of love!",
  }

  return (
    tips[word] ||
    `Break "${word}" into smaller parts and say it slowly. Then use it in a sentence you create yourself!`
  )
}

function getRelatedWords(word: string): string[] {
  const commonRelatedWords: { [key: string]: string[] } = {
    cat: ["kitten", "pet", "animal", "meow"],
    dog: ["puppy", "pet", "animal", "bark"],
    tree: ["plant", "forest", "leaf", "branch"],
    water: ["liquid", "ocean", "river", "drink"],
    sun: ["star", "light", "sky", "day"],
    book: ["read", "library", "story", "page"],
    apple: ["fruit", "tree", "red", "sweet"],
    flower: ["garden", "bloom", "petal", "plant"],
    star: ["night", "sky", "twinkle", "space"],
    heart: ["love", "organ", "beat", "chest"],
  }

  return commonRelatedWords[word] || ["learn", "study", "practice", "understand"]
}

function determineDifficulty(word: string): string {
  if (word.length <= 4) return "easy"
  if (word.length <= 7) return "medium"
  return "advanced"
}

function getEmojiForWord(word: string): string {
  const emojiMap: { [key: string]: string } = {
    cat: "🐱",
    dog: "🐶",
    tree: "🌳",
    water: "💧",
    sun: "☀️",
    book: "📚",
    apple: "🍎",
    flower: "🌸",
    star: "⭐",
    heart: "❤️",
    elephant: "🐘",
    lion: "🦁",
    moon: "🌙",
    rain: "🌧️",
    house: "🏠",
    school: "🏫",
    happy: "😊",
    sad: "😢",
    friend: "👫",
    family: "👨‍👩‍👧‍👦",
  }

  return emojiMap[word] || "📖"
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
