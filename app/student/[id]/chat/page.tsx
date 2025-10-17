"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"
import type { ChangeEvent, FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Volume2, BookOpen, Calculator, Brain } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type ActivityMode = "homework" | "reading"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface UseSimpleChatOptions {
  api: string
  body?: Record<string, unknown>
  onFinish?: (message: ChatMessage, context: { userMessage: ChatMessage; success: boolean }) => Promise<void> | void
}

function useSimpleChat({ api, body, onFinish }: UseSimpleChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmed = input.trim()
      if (!trimmed) {
        return
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(body || {}),
            messages: [...messagesRef.current, userMessage].map(({ role, content }) => ({ role, content })),
          }),
        })

        const responseText = (await response.text()).trim()
        const success = response.ok

        let assistantContent = responseText

        if (!responseText) {
          assistantContent = "I'm here, but I couldn't come up with an answer. Please try again."
        } else if (!success) {
          try {
            const parsed = JSON.parse(responseText)
            assistantContent = parsed.error || parsed.message || assistantContent
          } catch {
            // fall back to raw text
          }
        }

        assistantContent = assistantContent.trim()

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (onFinish) {
          await onFinish(assistantMessage, { userMessage, success })
        }
      } catch (error) {
        console.error("[v0] Chat error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: "Oops! Something went wrong. Please try asking again in a moment.",
            timestamp: Date.now(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [api, body, input, onFinish],
  )

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    setInput,
  }
}

export default function ChatWithMoePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<ActivityMode>("homework")
  const [readingSentence, setReadingSentence] = useState<string>("")
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false)
  const [studyTime, setStudyTime] = useState(0)
  const searchParams = useSearchParams()
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useSimpleChat({
    api: "/api/chat",
    body: {
      studentId: id,
      mode,
    },
    onFinish: async (assistantMessage, { userMessage, success }) => {
      if (!success || mode === "reading") return

      try {
        const supabase = getSupabaseBrowserClient()

        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .insert({
            student_id: id,
            question_text: userMessage.content,
            question_type: "other",
            subject: "Homework",
            input_method: "text",
            avatar_used: "moe",
          })
          .select()
          .maybeSingle()

        if (questionError) {
          console.error("[v0] Error inserting question:", questionError)
          return
        }

        if (questionData) {
          await supabase.from("answers").insert({
            question_id: questionData.id,
            answer_text: assistantMessage.content,
          })

          const { error: sessionLogError } = await supabase.from("study_sessions").insert({
            student_id: id,
            subject: "Homework",
            duration_minutes: 1,
            questions_answered: 1,
            questions_correct: 0,
          })

          if (sessionLogError) console.error("[v0] Error logging study session:", sessionLogError)
        }
      } catch (error) {
        console.error("[v0] Error logging to database:", error)
      }
    },
  })

  // Voice input state and handlers (defined after the hook)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const startListening = () => {
    if (typeof window === "undefined") return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript as string | undefined
      if (transcript) setInput(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current?.abort?.()
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop?.()
    setIsListening(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (mode === "reading") {
      return
    }

    const interval = setInterval(() => {
      setStudyTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [mode])

  useEffect(() => {
    const welcomeMessages = {
      homework:
        "Hi there! I'm Moe, your friendly AI tutor! Ask me any homework question - math, science, reading, or anything else you're learning!",
      reading:
        "Hi! I'm Moe! I'll create fun sentences for you to practice reading. Tap any word to hear how it sounds!",
    }

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[mode],
        timestamp: Date.now(),
      },
    ])
    setInput("")
  }, [mode, setMessages, setInput])

  useEffect(() => {
    const modeParam = searchParams.get("mode")
    if (modeParam && ["homework", "reading"].includes(modeParam) && modeParam !== mode) {
      setMode(modeParam as ActivityMode)
    }
  }, [searchParams, mode])

  const generateReadingSentence = async () => {
    setIsGeneratingSentence(true)
    try {
      const response = await fetch("/api/generate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id }),
      })
      const data = await response.json()
      setReadingSentence(data.sentence)
    } catch (error) {
      console.error("[v0] Error generating sentence:", error)
    } finally {
      setIsGeneratingSentence(false)
    }
  }

  const pronounceWord = (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.8
    utterance.pitch = 1.1
    window.speechSynthesis.speak(utterance)
  }

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const formatStudyTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const suggestQuestion = (question: string, nextMode?: ActivityMode) => {
    if (nextMode && nextMode !== mode) {
      setMode(nextMode)
    }
    setInput(question)
  }

  const suggestionButtons: Array<{
    label: string
    prompt: string
    icon: LucideIcon
    bg: string
    hover: string
    text: string
    border: string
    modeOverride?: ActivityMode
  }> = [
    {
      label: "Math Help",
      prompt: "Help me solve this math problem: ",
      icon: Calculator,
      bg: "bg-green-100",
      hover: "hover:bg-green-200",
      text: "text-green-700",
      border: "border-green-300",
      modeOverride: "homework",
    },
    {
      label: "Explain",
      prompt: "Can you explain ",
      icon: Brain,
      bg: "bg-orange-100",
      hover: "hover:bg-orange-200",
      text: "text-orange-700",
      border: "border-orange-300",
      modeOverride: "homework",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
      <header className="border-b-4 border-orange-400 bg-white/90 p-4 shadow-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link href={`/student/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-blue-500 text-3xl shadow-lg">
                🤖
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mi Ticha</h1>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Chat with Moe
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
            <div className="rounded-xl border-2 border-purple-300 bg-purple-100 px-4 py-2">
              <p className="text-xs text-gray-600">Study Time</p>
              <p className="font-mono text-2xl font-bold text-purple-700">{formatStudyTime(studyTime)}</p>
            </div>
            <Button asChild className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">
              <Link href={`/student/${id}/learn-words`}>Learn Words</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between gap-3">
          <Button variant="ghost" asChild className="md:hidden">
            <Link href={`/student/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Tabs value={mode} onValueChange={(value) => setMode(value as ActivityMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-orange-100 p-1">
              <TabsTrigger
                value="homework"
                className="gap-2 rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600"
              >
                <Calculator className="h-4 w-4" />
                Homework Help
              </TabsTrigger>
              <TabsTrigger
                value="reading"
                className="gap-2 rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600"
              >
                <BookOpen className="h-4 w-4" />
                Reading Practice
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="flex-1 relative">
        <div className="mx-auto max-w-5xl px-2 sm:px-4 py-6 pb-36">
          {mode === "reading" && (
            <Card className="mb-6 border-2 border-accent bg-white p-6 shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Practice Reading</h2>
                  <Button
                    onClick={generateReadingSentence}
                    disabled={isGeneratingSentence}
                    size="sm"
                    className="bg-accent hover:bg-accent/90"
                  >
                    {isGeneratingSentence ? "Creating..." : "New Sentence"}
                  </Button>
                </div>
                {readingSentence ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Tap any word to hear it!</p>
                    <div className="flex flex-wrap gap-2 rounded-lg bg-accent/10 p-4">
                      {readingSentence.split(" ").map((word, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => pronounceWord(word)}
                          className="rounded-md bg-white px-3 py-2 text-lg font-semibold transition-all hover:scale-105 hover:bg-accent hover:text-white"
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                    <Button onClick={() => pronounceWord(readingSentence)} variant="outline" className="w-full gap-2">
                      <Volume2 className="h-4 w-4" />
                      Hear Full Sentence
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Click "New Sentence" to start practicing!</p>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-3 shadow-md transition-all
                    ${message.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none"
                      : "bg-white border-2 border-green-200 text-gray-800 rounded-bl-none"}
                  `}
                >
                  {message.role === "assistant" && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-3xl">🤖</span>
                      <span className="font-bold text-blue-600">Moe</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                  {message.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speakText(message.content)}
                      className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      <Volume2 className="h-4 w-4" />
                      Read aloud
                    </button>
                  )}
                  <span className={`absolute -bottom-5 text-xs opacity-60 ${message.role === "user" ? "right-2 text-blue-100" : "left-2 text-gray-500"}`}>{formatTimestamp(message.timestamp)}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border-2 border-green-200 bg-white p-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <p className="text-sm font-bold text-blue-600">Moe is thinking...</p>
                      <div className="mt-2 flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {mode !== "reading" && (
        <footer className="fixed bottom-0 left-0 right-0 z-20 border-t-4 border-orange-400 bg-white/95 p-4 shadow-2xl">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              {suggestionButtons.map(({ label, prompt, icon: Icon, bg, hover, text, border, modeOverride }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => suggestQuestion(prompt, modeOverride)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 font-semibold transition-all ${bg} ${hover} ${text} ${border}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-2 py-1 shadow-lg">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`rounded-full p-2 transition-colors ${isListening ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                tabIndex={-1}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={mode === "homework" ? "Ask Moe anything..." : "Ask Moe to help with reading..."}
                className="flex-1 rounded-xl border-none px-4 py-3 text-lg outline-none bg-transparent"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-6 w-6" />
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-gray-500">💡 Tip: Ask clear questions for better answers</p>
          </div>
        </footer>
      )}
    </div>
  )
}
