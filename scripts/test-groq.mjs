const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama-3.1-70b-versatile",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Say hello." },
    ],
  }),
})

console.log("status", response.status)
const text = await response.text()
console.log(text)
