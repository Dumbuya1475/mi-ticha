"use client"

import { use, useEffect, useRef, useState } from "react"
import { Volume2, BookOpen, Check, X, ArrowRight, Sparkles, Trophy } from "lucide-react"

type ViewState = "question" | "learning" | "review" | "success"

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
  void id

  const [currentView, setCurrentView] = useState<ViewState>("question")
  const [currentWord, setCurrentWord] = useState<WordDetails>({
    word: "photosynthesis",
    pronunciation: "fo-to-SIN-the-sis",
    definition: "The process plants use to make their own food using sunlight, water, and air.",
    simpleDefinition: "How plants make food from sunlight",
    example: "The mango tree in our yard does photosynthesis to grow big and strong.",
    memoryTip: "Think: Photo (light) + Synthesis (making) = Making with light!",
    relatedWords: ["plant", "sunlight", "oxygen", "leaves"],
    difficulty: "advanced",
    image: "🌱",
  })
  const [wordsLearned, setWordsLearned] = useState(8)
  const [showCelebration, setShowCelebration] = useState(false)
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

  const speakWord = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(currentWord.word)
    utterance.rate = 0.7
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const speakDefinition = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
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

  const QuestionView = () => (
    <div className="mx-auto max-w-2xl p-6">
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

  const LearningView = () => (
    <div className="mx-auto max-w-2xl p-6">
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
              <h3 className="mb-2 text-lg font-bold text-gray-800">Example from Sierra Leone:</h3>
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

  const ReviewView = () => (
    <div className="mx-auto max-w-2xl p-6">
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
            {[
              "Plants need food to grow, right? Just like you need food!",
              "But plants can't go to the market. So they make their own food!",
              "They use sunlight (like a cooking fire) + water + air → to make sugar (food)",
              "That whole process? That's photosynthesis!",
            ].map((step, index) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
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

  const SuccessView = () => (
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
            onClick={() => alert("Continue to next question!")}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-blue-600 shadow-lg transition hover:shadow-xl"
          >
            Keep Learning
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4 text-center text-gray-700">
        <p>
          <strong>🔔 Parent Notification Sent:</strong>
          <br />
          "Your child just learned the word '{currentWord.word}'"
        </p>
      </div>
    </div>
  )

  const Celebration = () =>
    showCelebration ? (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Sparkles className="h-32 w-32 animate-ping text-yellow-300" />
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50 py-8">
      <Celebration />

      <div className="mx-auto mb-6 max-w-2xl px-6">
        <div className="flex gap-2 overflow-x-auto rounded-xl bg-white p-3 shadow-md">
          {(
            [
              { label: "1. Question", state: "question" },
              { label: "2. Learning", state: "learning" },
              { label: "3. Review", state: "review" },
              { label: "4. Success", state: "success" },
            ] as Array<{ label: string; state: ViewState }>
          ).map(({ label, state }) => (
            <button
              key={state}
              type="button"
              onClick={() => setCurrentView(state)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                currentView === state ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {currentView === "question" && <QuestionView />}
      {currentView === "learning" && <LearningView />}
      {currentView === "review" && <ReviewView />}
      {currentView === "success" && <SuccessView />}
    </div>
  )
}
