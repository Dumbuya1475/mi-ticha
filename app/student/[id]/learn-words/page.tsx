"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Volume2,
  BookOpen,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Trophy,
  Mic,
  MicOff,
  ArrowLeft,
  Loader2,
} from "lucide-react"

type ViewState = "input" | "loading" | "question" | "learning" | "review" | "success"

type WordDetails = {
  word: string
  pronunciation: string
  definition: string
  simpleDefinition: string
  example: string
  memoryTip: string
  relatedWords: string[]
  difficulty: string
  image: string
}

export default function LearnWordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [currentView, setCurrentView] = useState<ViewState>("input")
  const [wordInput, setWordInput] = useState("")
  const [currentWord, setCurrentWord] = useState<WordDetails | null>(null)
  const [wordsLearned, setWordsLearned] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const initializeSpeechRecognition = () => {
    if (typeof window === "undefined") return null

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setWordInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return recognition
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition()
    }

    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please type the word instead.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleWordSubmit = async () => {
    if (!wordInput.trim()) return

    setIsGenerating(true)
    setCurrentView("loading")

    try {
      const response = await fetch("/api/learn-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: wordInput.trim(), studentId: id }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch word details")
      }

      const data = await response.json()
      setCurrentWord(data.wordDetails)
      setCurrentView("question")
    } catch (error) {
      console.error("[v0] Error fetching word:", error)
      alert("Sorry, couldn't find that word. Please try another one!")
      setCurrentView("input")
    } finally {
      setIsGenerating(false)
    }
  }

  const speakWord = () => {
    if (!currentWord || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(currentWord.word)
    utterance.rate = 0.7
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const speakDefinition = () => {
    if (!currentWord || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(currentWord.definition)
    utterance.rate = 0.8
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const handleLearned = () => {
    setShowCelebration(true)
    setWordsLearned((prev) => prev + 1)
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current)
    }
    celebrationTimeoutRef.current = setTimeout(() => {
      setCurrentView("success")
      setShowCelebration(false)
    }, 1500)
  }

  const handleLearnAnother = () => {
    setWordInput("")
    setCurrentWord(null)
    setCurrentView("input")
  }

  const handleBack = () => {
    router.push(`/student/${id}`)
  }

  const InputView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Home
      </Button>

      <div className="rounded-2xl border-4 border-blue-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
            📚
          </div>
          <h3 className="mb-2 text-2xl font-bold text-gray-800">What word do you want to learn?</h3>
          <p className="text-gray-600">Type a word or use your voice!</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleWordSubmit()}
              placeholder="Type a word..."
              className="flex-1 rounded-xl border-[3px] border-gray-300 px-6 py-4 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`rounded-xl px-6 py-4 font-bold text-white shadow-lg transition ${
                isListening
                  ? "animate-pulse bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
          </div>
          {isListening && (
            <p className="mt-3 text-center text-sm text-blue-600 animate-pulse">Listening... Speak now!</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleWordSubmit}
          disabled={!wordInput.trim() || isGenerating}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
        >
          Learn This Word!
        </button>

        <div className="mt-6 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm text-gray-700">
            💡 <strong>Tip:</strong> You can ask Moe about any word - big or small, easy or hard!
          </p>
        </div>
      </div>

      {wordsLearned > 0 && (
        <div className="mt-6 rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <p className="font-semibold text-gray-800">Words Learned Today: {wordsLearned}</p>
          </div>
        </div>
      )}
    </div>
  )

  const LoadingView = () => (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl border-4 border-blue-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl animate-bounce">
            🤖
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">Moe is looking up the word...</h3>
          <p className="mb-4 text-2xl font-bold text-blue-600">"{wordInput}"</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Finding the best explanation for you...</p>
        </div>
      </div>
    </div>
  )

  const QuestionView = () => {
    if (!currentWord) return null

    return (
      <div className="mx-auto max-w-2xl p-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Button>

        <div className="rounded-2xl border-4 border-blue-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
              🤖
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">You asked Moe:</h3>
            <p className="text-2xl font-bold text-blue-600">"What does {currentWord.word} mean?"</p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex gap-2">
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-600" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:0.1s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]" />
            </div>
            <p className="text-gray-600">Moe is thinking...</p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView("learning")}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white"
          >
            See Moe&apos;s Answer
          </button>
        </div>
      </div>
    )
  }

  const LearningView = () => {
    if (!currentWord) return null

    return (
      <div className="mx-auto max-w-2xl p-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Button>

        <div className="mb-6 flex items-center justify-between rounded-xl border-2 border-yellow-300 bg-yellow-100 p-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <p className="font-semibold text-gray-800">Words Learned Today: {wordsLearned}</p>
          </div>
          <button type="button" className="text-yellow-600 transition hover:text-yellow-700">
            <BookOpen className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 rounded-3xl border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-green-50 p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3 border-b-2 border-blue-200 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-2xl">🤖</div>
            <div>
              <p className="text-lg font-bold text-blue-700">Moe</p>
              <p className="text-sm text-gray-600">Your AI Teacher</p>
            </div>
          </div>

          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">{currentWord.image}</div>
            <h1 className="mb-4 text-5xl font-bold text-gray-900">{currentWord.word}</h1>
            <button
              type="button"
              onClick={speakWord}
              className="mx-auto flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-600 hover:shadow-xl"
            >
              <Volume2 className="h-5 w-5" />
              {currentWord.pronunciation}
            </button>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-green-200 bg-white p-6 shadow-md">
            <div className="mb-3 flex items-start gap-3">
              <div className="text-2xl">📖</div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-bold text-gray-800">What it means:</h3>
                <p className="text-xl leading-relaxed text-gray-700">{currentWord.simpleDefinition}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={speakDefinition}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              <Volume2 className="h-4 w-4" />
              Read this aloud
            </button>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">Full explanation:</h3>
                <p className="leading-relaxed text-gray-700">{currentWord.definition}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-orange-200 bg-white p-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📝</div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">Example:</h3>
                <p className="italic leading-relaxed text-gray-700">"{currentWord.example}"</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">Remember it like this:</h3>
                <p className="leading-relaxed text-gray-700">{currentWord.memoryTip}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-bold text-gray-800">Related words you might also learn:</h3>
            <div className="flex flex-wrap gap-2">
              {currentWord.relatedWords.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="rounded-full border-2 border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCurrentView("review")}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-4 font-bold text-gray-800 transition hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
              Not Clear
            </button>
            <button
              type="button"
              onClick={handleLearned}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-4 font-bold text-white shadow-lg transition hover:from-green-600 hover:to-green-700 hover:shadow-xl"
            >
              <Check className="h-5 w-5" />
              I Understand!
            </button>
          </div>
        </div>

        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center text-sm text-gray-700">
          💡 <strong>Pro tip:</strong> Try using this word in a sentence today to remember it better!
        </div>
      </div>
    )
  }

  const ReviewView = () => {
    if (!currentWord) return null

    return (
      <div className="mx-auto max-w-2xl p-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Button>

        <div className="rounded-2xl border-4 border-orange-300 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
              🤖
            </div>
            <h3 className="mb-4 text-2xl font-bold text-gray-800">No worries! Let me explain differently.</h3>
            <p className="text-gray-600">Moe will break it down into simpler parts for you.</p>
          </div>

          <div className="mb-6 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
            <h4 className="mb-4 text-lg font-bold text-gray-800">Think of it this way:</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                  1
                </div>
                <p className="text-gray-700">Let&apos;s break down the word: {currentWord.word}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                  2
                </div>
                <p className="text-gray-700">{currentWord.simpleDefinition}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                  3
                </div>
                <p className="text-gray-700">{currentWord.memoryTip}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                  4
                </div>
                <p className="text-gray-700">Remember: {currentWord.example}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLearned}
            className="w-full rounded-xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700"
          >
            Now I Get It! ✓
          </button>
        </div>
      </div>
    )
  }

  const SuccessView = () => {
    if (!currentWord) return null

    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-3xl bg-gradient-to-br from-green-400 to-blue-500 p-8 text-center text-white shadow-2xl">
          <div className="mb-6 text-8xl animate-bounce">🎉</div>
          <h2 className="mb-4 text-4xl font-bold">Awesome!</h2>
          <p className="mb-6 text-2xl">You learned a new word!</p>

          <div className="mb-6 rounded-2xl bg-white/20 p-6 backdrop-blur">
            <p className="mb-2 text-5xl font-bold">{wordsLearned}</p>
            <p className="text-lg">Words Learned Today</p>
          </div>

          <div className="mb-6 rounded-xl bg-white p-6 text-gray-800">
            <h3 className="mb-3 text-xl font-bold">🌟 You just learned:</h3>
            <p className="mb-2 text-3xl font-bold text-blue-600">{currentWord.word}</p>
            <p className="text-gray-600">{currentWord.simpleDefinition}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCurrentView("learning")}
              className="rounded-xl bg-white/20 py-4 font-bold text-white transition hover:bg-white/30"
            >
              Review Again
            </button>
            <button
              type="button"
              onClick={handleLearnAnother}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-blue-600 shadow-lg transition hover:shadow-xl"
            >
              Learn Another
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const Celebration = () =>
    showCelebration ? (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Sparkles className="h-32 w-32 animate-ping text-yellow-300" />
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50 py-8">
      <Celebration />

      {currentView === "input" && <InputView />}
      {currentView === "loading" && <LoadingView />}
      {currentView === "question" && <QuestionView />}
      {currentView === "learning" && <LearningView />}
      {currentView === "review" && <ReviewView />}
      {currentView === "success" && <SuccessView />}
    </div>
  )
}

function Button({
  children,
  variant = "default",
  onClick,
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "ghost"
  onClick?: () => void
  className?: string
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition"
  const variantStyles = variant === "ghost" ? "hover:bg-gray-100" : "bg-blue-600 text-white hover:bg-blue-700"

  return (
    <button type="button" onClick={onClick} className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </button>
  )
}
