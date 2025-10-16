import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const groqApiKey = process.env.GROQ_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const groq = groqApiKey ? createGroq({ apiKey: groqApiKey }) : null
const GROQ_WORD_MODEL = process.env.GROQ_WORD_MODEL ?? "llama-3.3-70b-versatile"

export async function POST(request: NextRequest) {
  try {
    const { word, studentId } = await request.json()

    if (!word || !studentId) {
      return NextResponse.json({ error: "Missing word or studentId" }, { status: 400 })
    }

    const cleanWord = String(word).trim().toLowerCase()

    if (!cleanWord) {
      return NextResponse.json({ error: "Word cannot be empty" }, { status: 400 })
    }

    const wordDetails = await resolveWordDetails(cleanWord)

    if (!wordDetails) {
      return NextResponse.json(
        {
          error:
            "Moe couldn't find that word yet. Try another spelling or a different word while Moe keeps learning!",
        },
        { status: 404 },
      )
    }

    const {
      data: existingRow,
      error: existingError,
    } = await supabase
      .from("words_learned")
      .select("id, mastered, times_reviewed")
      .eq("student_id", studentId)
      .eq("word", wordDetails.word)
      .maybeSingle()

    if (existingError) {
      console.error("[v0] Failed to load existing word record:", existingError)
      return NextResponse.json({ error: "Unable to save this word right now" }, { status: 500 })
    }

    const timesReviewed = (existingRow?.times_reviewed || 0) + 1
    const mastered = existingRow?.mastered ?? false

    const { error: upsertError } = await supabase.from("words_learned").upsert(
      {
        student_id: studentId,
        word: wordDetails.word,
        definition: wordDetails.definition,
        example_sentence: wordDetails.example,
        pronunciation: wordDetails.pronunciation,
        mastered,
        times_reviewed: timesReviewed,
        last_reviewed_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,word",
      },
    )

    if (upsertError) {
      console.error("[v0] Failed to upsert word:", upsertError)
      return NextResponse.json({ error: "Unable to save this word right now" }, { status: 500 })
    }

    await logWordLearningEvent(studentId, wordDetails.word, "lookup", wordDetails)

    return NextResponse.json({
      wordDetails: {
        ...wordDetails,
        timesReviewed,
        alreadyMastered: mastered,
      },
    })
  } catch (error) {
    console.error("[v0] Error in learn-word POST:", error)
    return NextResponse.json({ error: "Something went wrong fetching that word." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { word, studentId, outcome } = await request.json()

    if (!word || !studentId || !outcome) {
      return NextResponse.json({ error: "Missing word, studentId, or outcome" }, { status: 400 })
    }

    const cleanWord = String(word).trim().toLowerCase()

    const { data: existingRow, error: fetchError } = await supabase
      .from("words_learned")
      .select("id, mastered, times_reviewed")
      .eq("student_id", studentId)
      .eq("word", cleanWord)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Failed to load word for update:", fetchError)
      return NextResponse.json({ error: "Unable to update this word right now" }, { status: 500 })
    }

    if (!existingRow) {
      return NextResponse.json({ error: "Word not found for that student" }, { status: 404 })
    }

    const timesReviewed = (existingRow.times_reviewed || 0) + 1
    const mastered = outcome === "mastered" ? true : existingRow.mastered

    const { error: updateError } = await supabase
      .from("words_learned")
      .update({
        times_reviewed: timesReviewed,
        last_reviewed_at: new Date().toISOString(),
        mastered,
      })
      .eq("id", existingRow.id)

    if (updateError) {
      console.error("[v0] Failed to update word status:", updateError)
      return NextResponse.json({ error: "Unable to update this word" }, { status: 500 })
    }

    await logWordLearningEvent(studentId, cleanWord, outcome === "mastered" ? "mastered" : "needs_review")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in learn-word PATCH:", error)
    return NextResponse.json({ error: "Something went wrong saving your progress." }, { status: 500 })
  }
}

async function logWordLearningEvent(
  studentId: string,
  word: string,
  status: string,
  payload?: Record<string, unknown>,
) {
  try {
    const { error } = await supabase.from("word_learning_sessions").insert({
      student_id: studentId,
      word,
      status,
      payload: payload ?? null,
    })

    if (error && error.code !== "42P01") {
      console.error("[v0] Failed to log word learning session:", error)
    }

    const now = new Date().toISOString()
    const minutes = status === "mastered" ? 3 : 1
    const questionsAnswered = status === "mastered" ? 1 : 0
    const questionsCorrect = status === "mastered" ? 1 : 0

    const { error: sessionError } = await supabase.from("study_sessions").insert({
      student_id: studentId,
      subject: "Vocabulary",
      duration_minutes: minutes,
      questions_answered: questionsAnswered,
      questions_correct: questionsCorrect,
      started_at: now,
      ended_at: now,
    })

    if (sessionError && sessionError.code !== "42P01") {
      console.error("[v0] Failed to record vocabulary study session:", sessionError)
    }
  } catch (error) {
    console.error("[v0] Unexpected error logging word learning session:", error)
  }
}

type WordDetails = {
  word: string
  pronunciation: string
  definition: string
  simpleDefinition: string
  example: string
  memoryTip: string
  relatedWords: string[]
  difficulty: string
  audioUrl?: string | null
}

async function resolveWordDetails(word: string): Promise<WordDetails | null> {
  const dictionaryEntry = await fetchDictionaryEntry(word)
  if (dictionaryEntry) {
    return dictionaryEntry
  }

  const aiEntry = await fetchAIEntry(word)
  if (aiEntry) {
    return aiEntry
  }

  return null
}

async function fetchDictionaryEntry(word: string): Promise<WordDetails | null> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as DictionaryResult[]

    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    const entry = data[0]
    const meaning = entry.meanings?.[0]
    const definition = meaning?.definitions?.[0]

    if (!definition?.definition) {
      return null
    }

    const synonyms = (meaning?.synonyms ?? []).slice(0, 6)
    const simplifiedDefinition =
      definition.definition.length > 140 ? `${definition.definition.slice(0, 137)}...` : definition.definition

    const pronunciation = entry.phonetic || entry.phonetics?.find((item) => item.text)?.text || word
    const audioUrl = entry.phonetics?.find((item) => item.audio)?.audio
    const example = definition.example || meaning?.definitions?.find((def) => def.example)?.example || ""

    return {
      word: entry.word?.toLowerCase() ?? word,
      pronunciation,
      definition: definition.definition,
      simpleDefinition: simplifiedDefinition,
      example,
      memoryTip: buildMemoryTip(entry.word ?? word),
      relatedWords: synonyms.length > 0 ? synonyms : buildFallbackRelatedWords(word),
      difficulty: determineDifficulty(word),
      audioUrl,
    }
  } catch (error) {
    console.error("[v0] Dictionary lookup failed:", error)
    return null
  }
}

async function fetchAIEntry(word: string): Promise<WordDetails | null> {
  try {
    if (!groq) {
      console.warn("[v0] GROQ_API_KEY is missing; using fallback word details")
      return fallbackAIEntry(word)
    }

    const { text } = await generateText({
      model: groq(GROQ_WORD_MODEL),
      prompt: `You are Moe, an enthusiastic tutor for 8-14 year old students in Sierra Leone. A student asked to learn the word "${word}".

Respond with a single JSON object using this exact shape:
{
  "word": string (lowercase),
  "pronunciation": string (friendly syllables),
  "definition": string (clear but rich),
  "simpleDefinition": string (one short kid-friendly sentence),
  "example": string (one sentence, local context, no quotes),
  "memoryTip": string (fun way to remember),
  "relatedWords": string[] (3-5 simple words),
  "difficulty": "easy" | "medium" | "advanced"
}

Keep the response strictly JSON with double quotes and no code fences.`,
    })

    const parsed = safeJsonParse<WordDetails>(text)

    if (!parsed) {
      return fallbackAIEntry(word)
    }

    return {
      ...parsed,
      word: parsed.word?.toLowerCase() ?? word.toLowerCase(),
      relatedWords: Array.isArray(parsed.relatedWords) && parsed.relatedWords.length > 0
        ? parsed.relatedWords.slice(0, 6)
        : buildFallbackRelatedWords(word),
      difficulty: parsed.difficulty ?? determineDifficulty(word),
    }
  } catch (error) {
    console.error("[v0] AI lookup failed:", error)
    return fallbackAIEntry(word)
  }
}

function fallbackAIEntry(word: string): WordDetails {
  return {
    word: word.toLowerCase(),
    pronunciation: buildSyllablePronunciation(word),
    definition: `${capitalize(word)} is an important word to learn. It describes something you may see or use in daily life.`,
    simpleDefinition: `${capitalize(word)} means something helpful to know about.`,
    example: `I used the word ${word.toLowerCase()} when I talked about school today.`,
    memoryTip: buildMemoryTip(word),
    relatedWords: buildFallbackRelatedWords(word),
    difficulty: determineDifficulty(word),
    audioUrl: undefined,
  }
}

function safeJsonParse<T>(text: string): T | null {
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim()
    return JSON.parse(cleaned) as T
  } catch (error) {
    console.warn("[v0] Failed to parse AI JSON:", error)
    return null
  }
}

function buildMemoryTip(word: string) {
  const base = word.slice(0, 3)
  return `Remember: "${word}" starts with "${base}" – say it slowly and clap the syllables to lock it in!`
}

function buildFallbackRelatedWords(word: string) {
  if (word.length <= 4) {
    return ["spell", "say", "use", "practice"]
  }

  if (word.length <= 7) {
    return ["meaning", "practice", "sentence", "remember"]
  }

  return ["definition", "study", "explain", "share"]
}

function determineDifficulty(word: string) {
  if (word.length <= 4) return "easy"
  if (word.length <= 7) return "medium"
  return "advanced"
}

function buildSyllablePronunciation(word: string) {
  const syllables = word.match(/[^aeiouy]*[aeiouy]+/gi) || [word]
  return syllables.join("-")
}

function capitalize(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

interface DictionaryResult {
  word?: string
  phonetic?: string
  phonetics?: Array<{
    text?: string
    audio?: string
  }>
  meanings?: Array<{
    partOfSpeech?: string
    definitions?: Array<{
      definition: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }>
    synonyms?: string[]
    antonyms?: string[]
  }>
}
