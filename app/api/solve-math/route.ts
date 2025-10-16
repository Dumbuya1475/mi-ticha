import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export const maxDuration = 45

export async function POST(request: NextRequest) {
  try {
    const { problem } = await request.json()

    if (!problem || typeof problem !== "string") {
      return NextResponse.json({ error: "Please provide a math problem to solve." }, { status: 400 })
    }

    const prompt = `You are Moe, a joyful tutor helping an 8-14 year old student from Sierra Leone.
Solve this math problem step-by-step: ${problem}.

Return ONLY valid JSON with this shape:
{
  "question": string,
  "topic": string,
  "difficulty": "easy" | "medium" | "hard",
  "answer": string,
  "steps": Array<{
    "title": string,
    "explanation": string,
    "visual": string,
    "tip": string
  }>,
  "realWorldExample": string,
  "practiceProblems": Array<{
    "question": string,
    "answer": string,
    "hint": string
  }>,
  "encouragement": string
}

Rules:
- Keep language friendly and simple.
- visuals can be ASCII layout to show work (<= 6 lines each).
- At least 4 steps, no more than 6.
- Practice problems should match the topic and be solvable by the student.
- Use culturally relevant examples when possible.
- Output must be JSON only with double quotes.`

    const { text } = await generateText({
      model: "groq/llama-3.1-70b-versatile",
      prompt,
      maxOutputTokens: 900,
    })

    const parsed = safeJsonParse<TutorResponse>(text)

    if (!parsed) {
      return NextResponse.json(
        { error: "Moe had trouble solving that. Try rephrasing the math question." },
        { status: 422 },
      )
    }

    return NextResponse.json({ solution: normalizeTutorResponse(parsed) })
  } catch (error) {
    console.error("[v0] Error in solve-math API:", error)
    return NextResponse.json({ error: "We couldn't solve that math question right now." }, { status: 500 })
  }
}

interface TutorResponse {
  question: string
  topic: string
  difficulty: string
  answer: string | number
  steps: Array<{
    title: string
    explanation: string
    visual: string
    tip: string
  }>
  realWorldExample: string
  practiceProblems: Array<{
    question: string
    answer: string | number
    hint: string
  }>
  encouragement?: string
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim()
    return JSON.parse(cleaned) as T
  } catch (error) {
    console.warn("[v0] Failed to parse tutor JSON:", error, raw)
    return null
  }
}

function normalizeTutorResponse(response: TutorResponse): NormalizedTutorResponse {
  const steps = Array.isArray(response.steps) && response.steps.length > 0 ? response.steps : fallbackSteps(response)
  const practiceProblems =
    Array.isArray(response.practiceProblems) && response.practiceProblems.length > 0
      ? response.practiceProblems
      : fallbackPracticeProblems(response)

  return {
    question: response.question?.trim() || "Let's solve this problem together!",
    topic: response.topic?.trim() || "General Math",
    difficulty: mapDifficulty(response.difficulty),
    answer: String(response.answer ?? ""),
    steps: steps.map((step, index) => ({
      title: step.title?.trim() || `Step ${index + 1}`,
      explanation: step.explanation?.trim() || "Let's think through this part carefully.",
      visual: step.visual?.trim() || "",
      tip: step.tip?.trim() || "Keep going—you are doing great!",
    })),
    realWorldExample:
      response.realWorldExample?.trim() || "Imagine using this math idea while shopping at the market in Freetown.",
    practiceProblems: practiceProblems.map((problem) => ({
      question: problem.question?.trim() || "Try a similar problem.",
      answer: String(problem.answer ?? ""),
      hint: problem.hint?.trim() || "Use the same steps we just practiced!",
    })),
    encouragement:
      response.encouragement?.trim() || "Awesome effort! Keep practicing and you will master this in no time.",
  }
}

interface NormalizedTutorResponse {
  question: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  answer: string
  steps: Array<{
    title: string
    explanation: string
    visual: string
    tip: string
  }>
  realWorldExample: string
  practiceProblems: Array<{
    question: string
    answer: string
    hint: string
  }>
  encouragement: string
}

function mapDifficulty(value: string | undefined): "easy" | "medium" | "hard" {
  const normal = value?.toLowerCase().trim()
  if (normal === "easy" || normal === "medium" || normal === "hard") {
    return normal
  }
  return "medium"
}

function fallbackSteps(response: TutorResponse): TutorResponse["steps"] {
  const question = response.question || "this math problem"
  return [
    {
      title: "Understand the problem",
      explanation: `Read the problem carefully: ${question}. What are we trying to find?` ,
      visual: question,
      tip: "Underline the important numbers and words.",
    },
    {
      title: "Choose a strategy",
      explanation: "Think about what math operation we should use and why.",
      visual: "Strategy → Steps → Answer",
      tip: "Remember similar problems you've solved before.",
    },
    {
      title: "Work it out",
      explanation: "Solve the problem step-by-step. Write down your work clearly.",
      visual: "Step 1\nStep 2\nStep 3",
      tip: "Double-check each step before moving on.",
    },
    {
      title: "Check your answer",
      explanation: "Does your answer make sense? Try the reverse operation to be sure.",
      visual: "Check → Reason → Share",
      tip: "If it doesn't make sense, retrace your steps calmly.",
    },
  ]
}

function fallbackPracticeProblems(response: TutorResponse): TutorResponse["practiceProblems"] {
  const topic = response.topic || "math"
  return [
    {
      question: `Create a new ${topic} question similar to the original one and solve it yourself.`,
      answer: "",
      hint: "Follow the main steps Moe showed you.",
    },
  ]
}
