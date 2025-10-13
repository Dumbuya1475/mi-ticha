"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Sparkles, Volume2, BookOpen, Calculator } from "lucide-react"
import { useChat } from "ai"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type ActivityMode = "homework" | "pronunciation" | "reading"

export default function ChatWithMoePage({ params }: { params: { id: string } }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<ActivityMode>("homework")
  const [readingSentence, setReadingSentence] = useState<string>("")
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: {
      studentId: params.id,
      mode,
    },
    onFinish: async (message) => {
      if (mode === "homework" || mode === "pronunciation") {
        try {
          const supabase = getSupabaseBrowserClient()

          // Find the user's question (last user message before this assistant message)
          const userMessages = messages.filter((m) => m.role === "user")
          const lastUserMessage = userMessages[userMessages.length - 1]

          if (lastUserMessage) {
            // Insert question
            const { data: questionData, error: questionError } = await supabase
              .from("questions")
              .insert({
                student_id: params.id,
                question_text: lastUserMessage.content,
                question_type: mode === "pronunciation" ? "word" : "other",
                input_method: "text",
                avatar_used: "moe",
              })
              .select()
              .maybeSingle()

            if (!questionError && questionData) {
              // Insert answer
              await supabase.from("answers").insert({
                question_id: questionData.id,
                answer_text: message.content,
              })
            }
          }
        } catch (error) {
          console.error("[v0] Error logging to database:", error)
        }
      }
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const welcomeMessages = {
      homework:
        "Hi there! I'm Moe, your friendly AI tutor! Ask me any homework question - math, science, reading, or anything else you're learning!",
      pronunciation:
        "Hi! I'm Moe! Type any word you want to learn, and I'll help you pronounce it and tell you what it means!",
      reading:
        "Hi! I'm Moe! I'll create fun sentences for you to practice reading. Tap any word to hear how it sounds!",
    }

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[mode],
      },
    ])
  }, [mode, setMessages])

  const generateReadingSentence = async () => {
    setIsGeneratingSentence(true)
    try {
      const response = await fetch("/api/generate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: params.id }),
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
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8 // Slower for kids
      utterance.pitch = 1.1 // Slightly higher pitch
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
      {/* Header */}
      <header className="border-b bg-white/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/student/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 font-bold text-white">
                M
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-lg">Moe</h1>
              <p className="text-muted-foreground text-xs">Your AI Tutor</p>
            </div>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <div className="border-b bg-white/60 px-4 py-2 backdrop-blur-sm">
        <Tabs value={mode} onValueChange={(v) => setMode(v as ActivityMode)} className="mx-auto max-w-4xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="homework" className="gap-2">
              <Calculator className="h-4 w-4" />
              Homework Help
            </TabsTrigger>
            <TabsTrigger value="pronunciation" className="gap-2">
              <Volume2 className="h-4 w-4" />
              Say Words
            </TabsTrigger>
            <TabsTrigger value="reading" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Reading Practice
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {mode === "reading" && (
            <Card className="border-2 border-accent bg-white p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">Practice Reading</h2>
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
                    <p className="text-muted-foreground text-sm">Tap any word to hear it!</p>
                    <div className="flex flex-wrap gap-2 rounded-lg bg-accent/10 p-4">
                      {readingSentence.split(" ").map((word, index) => (
                        <button
                          key={index}
                          onClick={() => pronounceWord(word)}
                          className="rounded-md bg-white px-3 py-2 font-semibold text-lg transition-all hover:scale-105 hover:bg-accent hover:text-white"
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

          {/* Chat Messages */}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-primary">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 font-bold text-white">
                    M
                  </AvatarFallback>
                </Avatar>
              )}
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "border-2 border-secondary bg-secondary text-secondary-foreground"
                    : "border-2 bg-white"
                }`}
              >
                <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
              </Card>
              {message.role === "user" && (
                <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-secondary">
                  <AvatarFallback className="bg-secondary font-bold text-secondary-foreground">U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-primary">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 font-bold text-white">
                  M
                </AvatarFallback>
              </Avatar>
              <Card className="border-2 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                  <p className="text-muted-foreground text-base">Moe is thinking...</p>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      {mode !== "reading" && (
        <footer className="border-t bg-white/80 px-4 py-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={mode === "homework" ? "Ask Moe a question..." : "Type a word to learn..."}
              className="h-12 flex-1 text-base"
              disabled={isLoading}
            />
            <Button type="submit" size="lg" className="h-12 px-6 font-semibold" disabled={isLoading || !input.trim()}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          <p className="mx-auto mt-2 max-w-4xl text-center text-muted-foreground text-xs">
            {mode === "homework" ? "Ask about math, science, reading, or any homework!" : "Type any word to learn!"}
          </p>
        </footer>
      )}
    </div>
  )
}
