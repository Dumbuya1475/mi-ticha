import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase credentials are not configured for word bank logging.")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, studentId, status, markMastered, payload } = body ?? {}

    if (!word || !studentId) {
      return NextResponse.json({ error: "Missing word or studentId" }, { status: 400 })
    }

    const normalizedWord = String(word).trim().toLowerCase()
    const normalizedStatus = typeof status === "string" && status.trim().length > 0 ? status.trim() : "pronounced"
    const shouldMarkMastered = Boolean(markMastered)
    const payloadData = payload && typeof payload === "object" ? payload : null
  const sessionPayload = payloadData ?? { source: "pronunciation_tab" }

    if (!normalizedWord) {
      return NextResponse.json({ error: "Word cannot be empty" }, { status: 400 })
    }

    const { data: existingRow, error: fetchError } = await supabase
      .from("words_learned")
      .select("id, mastered, times_reviewed")
      .eq("student_id", studentId)
      .eq("word", normalizedWord)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[v0] Failed to load word before logging pronunciation:", fetchError)
      return NextResponse.json({ error: "Unable to log this word right now" }, { status: 500 })
    }

    const timesReviewed = (existingRow?.times_reviewed ?? 0) + 1
    const mastered = shouldMarkMastered ? true : existingRow?.mastered ?? false

    const { error: upsertError } = await supabase.from("words_learned").upsert(
      {
        student_id: studentId,
        word: normalizedWord,
        definition: existingRow ? undefined : null,
        example_sentence: existingRow ? undefined : null,
        pronunciation: existingRow ? undefined : null,
        mastered,
        times_reviewed: timesReviewed,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,word" },
    )

    if (upsertError) {
      console.error("[v0] Failed to upsert word for pronunciation log:", upsertError)
      return NextResponse.json({ error: "Unable to save this word right now" }, { status: 500 })
    }

    const { error: logError } = await supabase.from("word_learning_sessions").insert({
      student_id: studentId,
      word: normalizedWord,
      status: normalizedStatus,
      payload: sessionPayload,
    })

    if (logError && logError.code !== "42P01") {
      console.error("[v0] Failed to log pronunciation session:", logError)
    }

    const now = new Date().toISOString()
    const { error: sessionError } = await supabase.from("study_sessions").insert({
      student_id: studentId,
      subject: "Vocabulary",
      duration_minutes: 1,
      questions_answered: 0,
      questions_correct: 0,
      started_at: now,
      ended_at: now,
    })

    if (sessionError && sessionError.code !== "42P01") {
      console.error("[v0] Failed to record vocabulary session:", sessionError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error logging word pronunciation:", error)
    return NextResponse.json({ error: "Something went wrong while logging that word." }, { status: 500 })
  }
}
