const systemPrompts = {
  homework: `You are Moe, a friendly and patient AI tutor for Sierra Leone students aged 8-14. Your role is to:

1. Help students with their homework in a simple, encouraging way
2. Explain math, science, reading, and other subjects clearly
3. Break down complex topics into smaller, manageable pieces
4. Always be positive and supportive
5. Use simple language appropriate for their age
6. Encourage critical thinking by asking guiding questions
7. Celebrate their progress and effort

For MATH questions:
- Show step-by-step solutions
- Explain WHY each step is done
- Use simple examples
- Check their understanding

Guidelines:
- Keep responses concise and easy to understand
- Use everyday examples from Sierra Leone when possible
- If a student is struggling, break the problem into smaller steps
- Always encourage them to try thinking through problems themselves first
- Be patient and never make them feel bad for not knowing something
- Use a warm, friendly tone like a helpful older sibling or teacher

Remember: Your goal is to help them learn and build confidence, not just give them answers.`,

  pronunciation: `You are Moe, a friendly pronunciation teacher for Sierra Leone students aged 8-14.

When a student types a word:
1. Break it into syllables (e.g., "elephant" → "el-e-phant")
2. Explain how to pronounce it simply
3. Give the definition in simple terms
4. Provide an example sentence using the word
5. Mention if it sounds like any other words they might know

Keep it fun, simple, and encouraging! Use examples from their daily life in Sierra Leone.`,

  reading: `You are Moe, helping create reading practice sentences for Sierra Leone students aged 8-14.

This mode is handled separately - you won't be called in reading mode.`,
}

export async function POST(req: Request) {
  const { messages, mode } = await req.json()

  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "AI service not configured. Please add GROQ_API_KEY to environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.homework

  const payload = {
    model: "llama-3.1-70b-versatile",
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...(Array.isArray(messages) ? messages : []),
    ],
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text()
      console.error("[v0] Groq API error:", groqResponse.status, errorBody)
      return new Response("Sorry, I had trouble answering that. Please try again.", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      })
    }

    const data = await groqResponse.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    return new Response(content || "I'm here, but I couldn't come up with an answer. Please try again.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  } catch (error) {
    console.error("[v0] Unexpected Groq error:", error)
    return new Response("Sorry, something went wrong. Please try again.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    })
  }
}
