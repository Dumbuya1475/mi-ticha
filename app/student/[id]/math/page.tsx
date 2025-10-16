"use client"

import { FormEvent, use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calculator,
  Check,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  Trophy,
  Volume2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

type ViewState = "entry" | "question" | "solving" | "practice" | "success"

type Step = {
  title: string
  explanation: string
  visual: string
  tip: string
}

type PracticeProblem = {
  question: string
  answer: string
  hint: string
}

type TutorProblem = {
  question: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  answer: string
  steps: Step[]
  realWorldExample: string
  practiceProblems: PracticeProblem[]
  encouragement: string
}

const FALLBACK_PROBLEM: TutorProblem = {
  question: "What is 24 ÷ 6?",
  topic: "division",
  difficulty: "easy",
  answer: "4",
  steps: [
    {
      title: "Understand the question",
      explanation: "We want to know how many groups of 6 fit inside 24.",
      visual: "24 ÷ 6 = ?",
      tip: "Division means sharing equally.",
    },
    {
      title: "Think in multiplication",
      explanation: "Ask: 6 times what number equals 24?",
      visual: "6 × ? = 24",
      tip: "Use the times table you already know.",
    },
    {
      title: "Find the match",
      explanation: "We know 6 × 4 = 24, so the answer is 4.",
      visual: "6 × 4 = 24",
      tip: "Work carefully to avoid mistakes.",
    },
    {
      title: "Check yourself",
      explanation: "Multiply the answer back: 4 × 6 = 24, so it works!",
      visual: "4 × 6 = 24 ✓",
      tip: "Re-checking helps you build confidence.",
    },
  ],
  realWorldExample: "If you have 24 mangoes and share them with 6 friends, each friend will get 4 mangoes.",
  practiceProblems: [
    { question: "What is 18 ÷ 6?", answer: "3", hint: "Think of 6 times what gives 18." },
    { question: "What is 30 ÷ 6?", answer: "5", hint: "Use the same idea with 30." },
  ],
  encouragement: "Nice work! Keep sharing your ideas and practicing.",
}

const SAMPLE_PROMPTS = [
  "If I share 36 candies equally with 6 friends, how many candies does each friend get?",
  "Mom baked 5 trays of 8 cookies each. How many cookies did she bake in total?",
  "A rectangle is 9 cm long and has a perimeter of 30 cm. What is its width?",
  "I have $24 and want to buy notebooks that cost $3 each. How many notebooks can I buy?",
]

type MathStats = {
  totalSolved: number
}

type StudySessionRow = {
  questions_correct: number | null
}

function useCelebration() {
  const [showCelebration, setShowCelebration] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const triggerCelebration = (onFinish: () => void) => {
    setShowCelebration(true)
    timeoutRef.current = setTimeout(() => {
      setShowCelebration(false)
      onFinish()
    }, 1500)
  }

  const CelebrationOverlay = () =>
    showCelebration ? (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="animate-bounce text-9xl">🎉</div>
      </div>
    ) : null

  return { showCelebration, triggerCelebration, CelebrationOverlay }
}

export default function MathSolvingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [currentView, setCurrentView] = useState<ViewState>("entry")
  const [problemInput, setProblemInput] = useState("")
  const [tutorProblem, setTutorProblem] = useState<TutorProblem | null>(null)
  const [isLoadingProblem, setIsLoadingProblem] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [stats, setStats] = useState<MathStats>({ totalSolved: 0 })
  const { CelebrationOverlay, triggerCelebration } = useCelebration()

  useEffect(() => {
    void refreshStats()
  }, [id])

  const refreshStats = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("study_sessions")
        .select("questions_correct")
        .eq("student_id", id)
        .eq("subject", "Math")

      if (error) {
        console.error("[v0] Failed to load math stats:", error)
        return
      }

      const totalSolved = (data as StudySessionRow[] | null)?.reduce(
        (sum, session) => sum + (session.questions_correct ?? 0),
        0,
      ) ?? 0

      setStats({ totalSolved })
    } catch (error) {
      console.error("[v0] Unexpected error loading math stats:", error)
    }
  }

  const recordMathSession = async () => {
    try {
      const supabase = createBrowserClient()
      const now = new Date().toISOString()
      const { error } = await supabase.from("study_sessions").insert({
        student_id: id,
        subject: "Math",
        duration_minutes: 5,
        questions_answered: 1,
  questions_correct: 1,
        started_at: now,
        ended_at: now,
      })

      if (error) {
        console.error("[v0] Failed to record math session:", error)
        return
      }

      await refreshStats()
    } catch (error) {
      console.error("[v0] Unexpected error recording math session:", error)
    }
  }

  const handleProblemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = problemInput.trim()
    if (!trimmed) {
      setErrorMessage("Please type a math problem for Moe to solve.")
      return
    }

    setIsLoadingProblem(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/solve-math", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error ?? "Moe couldn't solve that just now. Try a simpler version.")
        return
      }

      const solution = (data.solution ?? null) as TutorProblem | null

      if (!solution) {
        setErrorMessage("Moe wasn't sure about that one. Let's try rephrasing the problem.")
        return
      }

      setTutorProblem(solution)
      setCurrentStep(0)
      setUserAnswer("")
      setCurrentView("question")
      stopSpeech()
    } catch (error) {
      console.error("[v0] Failed to fetch tutor solution:", error)
      setErrorMessage("We lost connection to Moe. Please try again in a moment.")
    } finally {
      setIsLoadingProblem(false)
    }
  }

  const currentProblem = tutorProblem ?? FALLBACK_PROBLEM

  const handleStepComplete = () => {
    if (currentStep < currentProblem.steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setCurrentView("practice")
    }
  }

  const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "")

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) {
      return
    }

    const normalizedUser = normalizeAnswer(userAnswer)
    const normalizedCorrect = normalizeAnswer(currentProblem.answer)

    const numericUser = Number.parseFloat(userAnswer)
    const numericCorrect = Number.parseFloat(currentProblem.answer)
    const bothNumeric = !Number.isNaN(numericUser) && !Number.isNaN(numericCorrect)

    const isCorrect =
      (bothNumeric && Math.abs(numericUser - numericCorrect) < 1e-6) || normalizedUser === normalizedCorrect

    if (isCorrect) {
      setErrorMessage(null)
      triggerCelebration(() => {
        setCurrentView("success")
        setUserAnswer("")
      })
      await recordMathSession()
    } else {
      setErrorMessage("Not quite! Let's review the steps again together.")
      setUserAnswer("")
      setCurrentStep(0)
      setCurrentView("solving")
    }
  }

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    stopSpeech()
    window.speechSynthesis.speak(utterance)
  }

  const QuestionView = () => (
    <div className="mx-auto max-w-3xl space-y-6 px-6">
      <Card className="border-4 border-emerald-200 bg-white shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            🤖
          </div>
          <CardTitle className="text-3xl text-emerald-600">Ready for a math adventure?</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Type any math problem and Moe will break it into friendly steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProblemSubmit} className="space-y-4">
            <label htmlFor="math-problem" className="text-sm font-semibold text-gray-700">
              Ask Moe a question
            </label>
            <textarea
              id="math-problem"
              value={problemInput}
              onChange={(event) => setProblemInput(event.target.value)}
              placeholder="e.g., I shared 36 candies equally with 6 friends. How many candies did each friend get?"
              rows={4}
              className="w-full rounded-xl border-2 border-emerald-200 px-4 py-3 text-lg leading-relaxed focus:border-emerald-400 focus:outline-none"
            />
            {errorMessage && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}
            <Button type="submit" disabled={isLoadingProblem} className="w-full bg-emerald-500 text-lg font-semibold text-white">
              {isLoadingProblem ? "Moe is thinking..." : "Solve with Moe"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 rounded-xl bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Need ideas?</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setProblemInput(sample)}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-100"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ProblemSummary = () => (
    <Card className="border-4 border-green-200 bg-white shadow-xl">
      <CardContent className="space-y-4 pt-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">🤖</div>
          <h3 className="text-xl font-bold text-gray-800">You asked Moe:</h3>
          <p className="mt-2 whitespace-pre-wrap text-3xl font-bold text-green-600">{currentProblem.question}</p>
        </div>

        <div className="rounded-full border-2 border-green-200 bg-green-50 px-5 py-2 text-center text-sm text-gray-600">
          Topic: <span className="font-semibold text-green-600 capitalize">{currentProblem.topic}</span> • Difficulty:
          <span className="font-semibold text-green-600 capitalize"> {currentProblem.difficulty}</span>
        </div>

        <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">Moe says:</p>
              <p className="text-sm text-gray-700">Don&apos;t worry if it looks hard! We&apos;ll solve it step-by-step together.</p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setCurrentView("solving")}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-lg font-bold text-white hover:from-green-600 hover:to-green-700"
        >
          Show me how!
        </Button>
      </CardContent>
    </Card>
  )

  const SolvingView = () => {
    const step = currentProblem.steps[currentStep]
    const progress = ((currentStep + 1) / currentProblem.steps.length) * 100

    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6">
        <ProblemSummary />

        <Card className="border-4 border-green-300 bg-gradient-to-br from-green-50 to-blue-50 shadow-2xl">
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-green-200 pb-4">
              <div className="flex items-center gap-3">
                <Calculator className="h-6 w-6 text-green-600" />
                <span className="font-semibold text-gray-800">
                  Step {currentStep + 1} of {currentProblem.steps.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-600">{stats.totalSolved} solved today</span>
              </div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl">🤖</div>
              <div className="flex-1">
                <p className="text-lg font-bold text-green-700">Moe</p>
                <p className="text-sm text-gray-600">Let&apos;s solve this together!</p>
              </div>
              <button
                type="button"
                onClick={() => speakText(step.explanation)}
                className="rounded-full bg-blue-100 p-2 transition hover:bg-blue-200"
              >
                <Volume2 className="h-5 w-5 text-blue-600" />
                <span className="sr-only">Listen to this step</span>
              </button>
            </div>

            <div className="text-center">
              <span className="inline-block rounded-full bg-green-500 px-6 py-2 text-lg font-bold text-white">
                {step.title}
              </span>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
              <pre className="whitespace-pre-wrap text-center font-mono text-2xl leading-relaxed text-gray-800">
                {step.visual}
              </pre>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-blue-200 bg-white p-5 shadow-md">
                <h4 className="mb-2 text-lg font-bold text-gray-800">Explanation</h4>
                <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{step.explanation}</p>
              </div>
              <div className="rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-5 shadow-md">
                <h4 className="mb-2 text-lg font-bold text-gray-800">Pro tip</h4>
                <p className="text-lg text-gray-700">{step.tip}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="h-12 disabled:opacity-50"
              >
                ← Previous Step
              </Button>
              <Button
                type="button"
                onClick={handleStepComplete}
                className="h-12 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              >
                {currentStep < currentProblem.steps.length - 1 ? "Next Step" : "Try a Practice Problem"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {currentStep === currentProblem.steps.length - 1 && (
              <div className="rounded-xl border-2 border-purple-300 bg-purple-50 p-5">
                <h4 className="mb-2 text-lg font-bold text-purple-700">Real-life example</h4>
                <p className="text-lg text-purple-800">{currentProblem.realWorldExample}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const PracticeView = () => (
    <div className="mx-auto max-w-3xl space-y-6 px-6">
      <ProblemSummary />

      <Card className="border-4 border-blue-200 bg-white shadow-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
              💪
            </div>
            <CardTitle className="text-2xl text-gray-800">Now you try!</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Solve the problem yourself to show Moe what you learned.
            </CardDescription>
          </div>

          <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{currentProblem.question}</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="practice-answer">
              Your answer
            </label>
            <div className="flex gap-3">
              <input
                id="practice-answer"
                type="text"
                value={userAnswer}
                onChange={(event) => setUserAnswer(event.target.value)}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-3 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none"
              />
              <Button
                type="button"
                onClick={handleAnswerSubmit}
                disabled={!userAnswer}
                className="h-14 w-14 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Check className="h-6 w-6" />
                <span className="sr-only">Submit answer</span>
              </Button>
            </div>
            {errorMessage && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentStep(0)
                setCurrentView("solving")
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4" /> Review the steps
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => alert("We\'ll add more problems soon!")}
            >
              Skip this one
            </Button>
          </div>

          <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-1 h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-gray-800">Need a hint?</p>
                <p className="text-sm text-gray-700">
                  Follow the same steps Moe showed you. Start by asking how many groups fit in the first number.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const SuccessView = () => (
    <div className="mx-auto max-w-3xl space-y-6 px-6">
      <Card className="border-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 text-white shadow-2xl">
        <CardContent className="space-y-6 pt-8 text-center">
          <div className="text-8xl">🌟</div>
          <CardTitle className="text-4xl">Perfect!</CardTitle>
          <CardDescription className="text-xl text-white/90">
            You solved it correctly. Moe is proud of you!
          </CardDescription>

          <div className="rounded-2xl bg-white/15 p-6">
            <p className="text-sm uppercase tracking-wide text-white/70">Math problems solved today</p>
            <p className="text-6xl font-extrabold">{stats.totalSolved}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 text-gray-800">
            <p className="text-sm font-semibold text-gray-500">You just solved</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{currentProblem.question}</p>
            <p className="mt-2 text-2xl font-bold text-green-600">= {currentProblem.answer}</p>
          </div>

          <div className="rounded-xl bg-white/15 p-5 text-left">
            <p className="text-lg font-semibold">🎓 What you learned</p>
            <ul className="mt-2 space-y-2 text-sm text-white/90">
              <li>• How to break down a division problem</li>
              <li>• How to double-check your work</li>
              <li>• How to explain the steps to someone else</li>
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUserAnswer("")
                setCurrentStep(0)
                setCurrentView("question")
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Review again
            </Button>
            <Button type="button" onClick={() => alert("Next problem coming soon!")}>
              Next problem
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-200 bg-yellow-50 text-center">
        <CardContent className="space-y-2 pt-6">
          <p className="font-semibold text-gray-800">🔔 Parent notification</p>
          <p className="text-sm text-gray-700">
            "Your child solved a math problem: {currentProblem.question}"
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="space-y-3 pt-6">
          <p className="font-semibold text-gray-800">🌟 Ready for more?</p>
          <p className="text-sm text-gray-700">Try these similar problems to master division:</p>
          <div className="space-y-2">
            {currentProblem.practiceProblems.map((practiceProblem) => (
              <div
                key={practiceProblem.question}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
              >
                <span className="text-sm font-semibold text-gray-800">{practiceProblem.question}</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => alert(practiceProblem.hint)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Try it
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const viewOrder: ViewState[] = ["entry", "question", "solving", "practice", "success"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <CelebrationOverlay />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Solve math with Moe</h1>
          <p className="text-sm text-gray-600">Moe breaks every problem into friendly steps so math feels easy.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/student/${id}`}>Back to dashboard</Link>
        </Button>
      </header>

      <nav className="mx-auto mb-6 max-w-3xl px-6">
        <div className="flex gap-2 overflow-x-auto rounded-xl bg-white p-3 shadow-md">
          {viewOrder.slice(1).map((state, index) => (
            <button
              key={state}
              type="button"
              onClick={() => setCurrentView(state)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                currentView === state ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {index + 1}. {state.charAt(0).toUpperCase() + state.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="pb-12">
        {currentView === "entry" && <QuestionView />}
        {currentView === "question" && tutorProblem && <ProblemSummary />}
        {currentView === "solving" && tutorProblem && <SolvingView />}
        {currentView === "practice" && tutorProblem && <PracticeView />}
        {currentView === "success" && tutorProblem && <SuccessView />}
        {currentView !== "entry" && !tutorProblem && <QuestionView />}
      </main>
    </div>
  )
}
