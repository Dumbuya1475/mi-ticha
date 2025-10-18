import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      studentId,
      passageId,
      title,
      durationMinutes,
      comprehensionScore,
      wordsRead,
      questionsAnswered,
      questionsCorrect,
    } = body ?? {}

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json({ error: "A valid studentId is required." }, { status: 400 })
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "A story title is required." }, { status: 400 })
    }

    const duration = Number.isFinite(durationMinutes) ? Math.max(Math.round(Number(durationMinutes)), 1) : 1
    const score = Number.isFinite(comprehensionScore) ? Math.max(Math.round(Number(comprehensionScore)), 0) : 0
    const totalWords = Number.isFinite(wordsRead) ? Math.max(Math.round(Number(wordsRead)), 0) : 0
    const answered = Number.isFinite(questionsAnswered) ? Math.max(Math.round(Number(questionsAnswered)), 0) : 0
    const correct = Number.isFinite(questionsCorrect) ? Math.max(Math.round(Number(questionsCorrect)), 0) : 0

    const adminClient = getSupabaseAdminClient()

    const { error: activityError } = await (adminClient as any).from("reading_activities").insert({
      student_id: studentId,
      passage_id: typeof passageId === "string" && passageId.length > 0 ? passageId : null,
      title,
      duration_minutes: duration,
      comprehension_score: Math.min(score, 100),
      words_read: totalWords,
    })

    if (activityError && activityError.code !== "42P01") {
      console.error("[v0] Failed to log reading activity:", activityError)
      return NextResponse.json({ error: "Unable to save reading activity right now." }, { status: 500 })
    }

    const { error: sessionError } = await (adminClient as any).from("study_sessions").insert({
      student_id: studentId,
      subject: "Reading",
      duration_minutes: duration,
      questions_answered: answered,
      questions_correct: correct,
    })

    if (sessionError && sessionError.code !== "42P01") {
      console.error("[v0] Failed to create study session for reading:", sessionError)
      return NextResponse.json({ error: "Unable to save study session right now." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected reading log error:", error)
    return NextResponse.json({ error: "Unexpected error while saving reading session." }, { status: 500 })
  }
}
