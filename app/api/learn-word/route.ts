import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    const dictionaryEntry = await fetchDictionaryEntry(cleanWord)

    if (!dictionaryEntry) {
      return NextResponse.json(
        {
          error: "We couldn't find that word in the dictionary. Try a different word or double-check the spelling.",
        },
        { status: 404 },
      )
    }

    const {
      data: existingRow,
      error: existingError,
    } = await supabase
      .from("words_learned")
      .select("id, mastered, times_reviewed, metadata")
      .eq("student_id", studentId)
      .eq("word", dictionaryEntry.word)
      .maybeSingle()

    if (existingError) {
      console.error("[v0] Failed to load existing word record:", existingError)
      return NextResponse.json({ error: "Unable to save this word right now" }, { status: 500 })
    }

    const timesReviewed = (existingRow?.times_reviewed || 0) + 1
    const mastered = existingRow?.mastered ?? false

    const upsertPayload = {
      student_id: studentId,
      word: dictionaryEntry.word,
      definition: dictionaryEntry.definition,
      example_sentence: dictionaryEntry.example,
      pronunciation: dictionaryEntry.pronunciation,
      mastered,
      times_reviewed: timesReviewed,
      last_reviewed_at: new Date().toISOString(),
      metadata: {
        ...(existingRow?.metadata as Record<string, unknown> | null),
        simpleDefinition: dictionaryEntry.simpleDefinition,
        memoryTip: dictionaryEntry.memoryTip,
        relatedWords: dictionaryEntry.relatedWords,
        difficulty: dictionaryEntry.difficulty,
        audioUrl: dictionaryEntry.audioUrl,
      },
    }

    const { error: upsertError } = await supabase.from("words_learned").upsert(upsertPayload, {
      onConflict: "student_id,word",
    })

    if (upsertError) {
      console.error("[v0] Failed to upsert word:", upsertError)
      return NextResponse.json({ error: "Unable to save this word right now" }, { status: 500 })
    }

    const { error: logError } = await supabase.from("word_learning_sessions").insert({
      student_id: studentId,
      word: dictionaryEntry.word,
      status: "started",
      payload: dictionaryEntry,
    })

    if (logError) {
      console.error("[v0] Failed to log word learning session:", logError)
    }

    return NextResponse.json({
      wordDetails: {
        ...dictionaryEntry,
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
      .select("id, mastered, times_reviewed, metadata")
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

    const { error: logError } = await supabase.from("word_learning_sessions").insert({
      student_id: studentId,
      word: cleanWord,
      status: outcome === "mastered" ? "mastered" : "needs_review",
      payload: { outcome },
    })

    if (logError) {
      console.error("[v0] Failed to log outcome:", logError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in learn-word PATCH:", error)
    return NextResponse.json({ error: "Something went wrong saving your progress." }, { status: 500 })
  }
}

async function fetchDictionaryEntry(word: string) {
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
    const simplifiedDefinition = definition.definition.length > 120
      ? `${definition.definition.slice(0, 117)}...`
      : definition.definition

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
