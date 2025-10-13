import { generateText } from "ai"
import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { studentId } = await req.json()

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Generate ONE simple, fun sentence for an 8-14 year old Sierra Leone student to practice reading.

Requirements:
- 6-12 words long
- Use common, everyday words
- Make it interesting or fun
- Can be about animals, family, school, food, nature, or daily life
- Appropriate for Sierra Leone context
- NO punctuation at the end
- Just return the sentence, nothing else

Examples:
"The big brown dog runs fast in the park"
"My sister loves to eat rice and cassava leaves"
"We play football every day after school"

Generate ONE new sentence now:`,
    })

    return NextResponse.json({ sentence: text.trim() })
  } catch (error) {
    console.error("[v0] Error generating sentence:", error)
    return NextResponse.json({ error: "Failed to generate sentence" }, { status: 500 })
  }
}
