import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { word, studentId } = await request.json()

    if (!word || !studentId) {
      return NextResponse.json({ error: "Missing word or studentId" }, { status: 400 })
    }

    const cleanWord = word.trim().toLowerCase()

    const supabase = createClient(supabaseUrl, supabaseKey)

    const wordDetails = {
      word: cleanWord,
      pronunciation: generatePronunciation(cleanWord),
      definition: `A ${cleanWord} is an important concept that students learn about.`,
      simpleDefinition: `${cleanWord} in simple terms`,
      example: `Here's an example using the word ${cleanWord}.`,
      memoryTip: `Think about ${cleanWord} this way to remember it!`,
      relatedWords: getRelatedWords(cleanWord),
      difficulty: determineDifficulty(cleanWord),
      image: getEmojiForWord(cleanWord),
    }

    const { error: insertError } = await supabase.from("word_learning_activities").insert({
      student_id: studentId,
      word: cleanWord,
      learned: false,
    })

    if (insertError) {
      console.error("[v0] Error logging word activity:", insertError)
    }

    return NextResponse.json({ wordDetails })
  } catch (error) {
    console.error("[v0] Error in learn-word API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generatePronunciation(word: string): string {
  const syllables = word.match(/[^aeiou]*[aeiou]+/gi) || [word]
  return syllables.join("-")
}

function getRelatedWords(word: string): string[] {
  const commonRelatedWords: { [key: string]: string[] } = {
    cat: ["dog", "pet", "animal", "kitten"],
    dog: ["cat", "pet", "animal", "puppy"],
    tree: ["plant", "forest", "leaf", "branch"],
    water: ["liquid", "ocean", "river", "drink"],
    sun: ["star", "light", "sky", "day"],
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
  }

  return emojiMap[word] || "📖"
}
