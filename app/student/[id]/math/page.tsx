"use client"

import { FormEvent, use, useEffect, useRef, useState } from "react"
import {
  Calculator,
  Volume2,
  Check,
  X,
  Lightbulb,
  ArrowRight,
  Trophy,
  RefreshCw,
  HelpCircle,
} from "lucide-react"
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

const SAMPLE_PROBLEMS = [
  "If I share 36 candies equally with 6 friends, how many candies does each friend get?",
  "Mom baked 5 trays of 8 cookies each. How many cookies did she bake in total?",
  "A rectangle is 9 cm long and has a perimeter of 30 cm. What is its width?",
  "I have $24 and want to buy notebooks that cost $3 each. How many notebooks can I buy?",
]

export default function MathSolvingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [currentView, setCurrentView] = useState<ViewState>("entry")
  const [problemInput, setProblemInput] = useState("")
  const [tutorProblem, setTutorProblem] = useState<TutorProblem | null>(null)
  const [isLoadingProblem, setIsLoadingProblem] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [problemsSolved, setProblemsSolved] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    void loadMathStats()
  }, [id])

  const loadMathStats = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("study_sessions")
        .select("correct_answers")
        .eq("student_id", id)
        .eq("subject", "Math")

      if (error) {
        console.error("[v0] Failed to load math stats:", error)
        return
      }

      const totalSolved =
        data?.reduce((sum, session) => sum + (typeof session.correct_answers === "number" ? session.correct_answers : 0), 0) || 0

      setProblemsSolved(totalSolved)
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
        correct_answers: 1,
        started_at: now,
        ended_at: now,
      })

      if (error) {
        console.error("[v0] Failed to record math session:", error)
        return
      }

      await loadMathStats()
    } catch (error) {
      console.error("[v0] Unexpected error recording math session:", error)
    }
  }

  const handleProblemSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

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

      const solution = data.solution as TutorProblem | undefined

      if (!solution) {
        setErrorMessage("Moe wasn't sure about that one. Let's try rephrasing the problem.")
        return
      }

      setTutorProblem(solution)
      setCurrentStep(0)
      setUserAnswer("")
      setCurrentView("question")
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    } catch (error) {
      console.error("[v0] Failed to fetch tutor solution:", error)
      setErrorMessage("We lost connection to Moe. Please try again in a moment.")
    } finally {
      setIsLoadingProblem(false)
    }
  }

  const handleStepComplete = () => {
    const steps = (tutorProblem ?? FALLBACK_PROBLEM).steps
    setErrorMessage(null)
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1)
    } else {
      setCurrentView("practice")
    }
  }

  const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "")

  const handleAnswerSubmit = async () => {
    const problem = tutorProblem ?? FALLBACK_PROBLEM

    if (!userAnswer.trim()) {
      return
    }

    const normalizedUser = normalizeAnswer(userAnswer)
    const normalizedCorrect = normalizeAnswer(problem.answer)

    const numericUser = Number.parseFloat(userAnswer)
    const numericCorrect = Number.parseFloat(problem.answer)
    const bothNumeric = !Number.isNaN(numericUser) && !Number.isNaN(numericCorrect)

    const isCorrect =
      (bothNumeric && Math.abs(numericUser - numericCorrect) < 1e-6) || normalizedUser === normalizedCorrect

    if (isCorrect) {
      setErrorMessage(null)
      setShowCelebration(true)
      celebrationTimeoutRef.current = setTimeout(() => {
        setShowCelebration(false)
        setCurrentView("success")
      }, 1500)
      setUserAnswer("")
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
    utterance.rate = 0.8
    stopSpeech()
    window.speechSynthesis.speak(utterance)
  }

    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border-4 border-green-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
              🤖
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">You asked Moe:</h3>
            <p className="mb-4 whitespace-pre-wrap text-4xl font-bold text-green-600">{problem.question}</p>

            <div className="mb-6 inline-block rounded-full border-2 border-green-200 bg-green-50 px-6 py-3">
              <p className="text-sm text-gray-600">
                Topic: <span className="font-bold text-green-600 capitalize">{problem.topic}</span> • Difficulty:{

  const SolvingView = () => {
    const step = PROBLEM.steps[currentStep]
    const progress = ((currentStep + 1) / PROBLEM.steps.length) * 100

    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-green-600" />
              <span className="font-bold text-gray-800">
                Step {currentStep + 1} of {PROBLEM.steps.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-600">{problemsSolved} solved</span>
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border-4 border-green-300 bg-gradient-to-br from-green-50 to-blue-50 p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3 border-b-2 border-green-200 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl">🤖</div>
            <div>
              <p className="text-lg font-bold text-green-700">Moe</p>
              <p className="text-sm text-gray-600">Let&apos;s solve this together!</p>
            </div>
            <button
              type="button"
              onClick={() => speakText(step.explanation)}
              className="ml-auto rounded-full bg-blue-100 p-2 transition hover:bg-blue-200"
            >
              <Volume2 className="h-5 w-5 text-blue-600" />
            </button>
          </div>

          <div className="mb-6 text-center">
            <div className="mb-4 inline-block rounded-full bg-green-500 px-6 py-2 text-lg font-bold text-white">
              {step.title}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg">
            <pre className="whitespace-pre-wrap text-center font-mono text-3xl leading-relaxed text-gray-800">
              {step.visual}
            </pre>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <h4 className="mb-2 text-lg font-bold text-gray-800">Explanation:</h4>
                <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{step.explanation}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✨</div>
              <div>
                <h4 className="mb-2 text-lg font-bold text-gray-800">Pro Tip:</h4>
                <p className="text-lg text-gray-700">{step.tip}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                className="rounded-xl bg-gray-100 py-4 font-bold text-gray-800 transition hover:bg-gray-200"
              >
                ← Previous Step
              </button>
            )}
            <button
              type="button"
              onClick={handleStepComplete}
              className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-4 font-bold text-white shadow-lg transition hover:from-green-600 hover:to-green-700 hover:shadow-xl ${
                currentStep === 0 ? "col-span-2" : ""
              }`}
            >
              {currentStep < PROBLEM.steps.length - 1 ? "Next Step" : "Try a Practice Problem"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {currentStep === PROBLEM.steps.length - 1 && (
          <div className="mt-6 rounded-xl border-2 border-purple-300 bg-purple-50 p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🌍</div>
              <div>
                <h4 className="mb-2 text-lg font-bold text-gray-800">Real Life Example:</h4>
                <p className="text-lg text-gray-700">{PROBLEM.realWorldExample}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const PracticeView = () => (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 rounded-2xl border-4 border-blue-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
            💪
          </div>
          <h3 className="mb-2 text-2xl font-bold text-gray-800">Now You Try!</h3>
          <p className="text-gray-600">Let&apos;s see if you can solve a similar problem</p>
        </div>

        <div className="mb-6 rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 p-8">
          <p className="mb-6 text-center text-4xl font-bold text-blue-600">{PROBLEM.question}</p>

          <div className="mx-auto max-w-md">
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="math-answer">
              Your Answer:
            </label>
            <div className="flex gap-3">
              <input
                id="math-answer"
                type="number"
                value={userAnswer}
                onChange={(event) => setUserAnswer(event.target.value)}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl border-[3px] border-gray-300 px-6 py-4 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAnswerSubmit}
                disabled={!userAnswer}
                className="rounded-xl bg-green-600 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Check className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setCurrentStep(0)
              setCurrentView("solving")
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-100 py-3 font-semibold text-yellow-800 transition hover:bg-yellow-200"
          >
            <HelpCircle className="h-5 w-5" />
            Review Steps
          </button>
          <button
            type="button"
            onClick={() => alert("We'll add more problems soon!")}
            className="rounded-xl bg-gray-100 py-3 font-semibold text-gray-800 transition hover:bg-gray-200"
          >
            Skip This One
          </button>
        </div>
      </div>

      <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-1 h-6 w-6 flex-shrink-0 text-orange-600" />
          <div>
            <h4 className="mb-2 font-bold text-gray-800">Need a hint?</h4>
            <p className="text-gray-700">
              Follow the same steps we just practiced! Start by asking: "How many 6s fit in the first part?"
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const SuccessView = () => (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-3xl bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 p-8 text-center text-white shadow-2xl">
        <div className="mb-6 text-8xl animate-bounce">🎉</div>
        <h2 className="mb-4 text-5xl font-bold">Perfect!</h2>
        <p className="mb-6 text-2xl">You solved it correctly!</p>

        <div className="mb-6 rounded-2xl bg-white/20 p-8 backdrop-blur">
          <p className="mb-3 text-6xl font-bold">{problemsSolved}</p>
          <p className="text-xl">Math Problems Solved Today</p>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 text-gray-800">
          <h3 className="mb-4 text-2xl font-bold">✓ You just solved:</h3>
          <p className="mb-3 text-4xl font-bold text-blue-600">{PROBLEM.question}</p>
          <p className="text-2xl font-bold text-green-600">= {PROBLEM.answer}</p>
        </div>

        <div className="mb-6 rounded-xl bg-white/10 p-6 backdrop-blur">
          <p className="mb-2 text-lg">🎓 What you learned:</p>
          <ul className="space-y-2 text-left">
            <li>✓ How to break down division problems</li>
            <li>✓ Step-by-step problem solving</li>
            <li>✓ How to check your work</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setUserAnswer("")
              setCurrentStep(0)
              setCurrentView("question")
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-4 font-bold text-white transition hover:bg-white/30"
          >
            <RefreshCw className="h-5 w-5" />
            Review Again
          </button>
          <button
            type="button"
            onClick={() => alert("Next problem coming soon!")}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-blue-600 shadow-lg transition hover:shadow-xl"
          >
            Next Problem
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4 text-center text-gray-700">
        <p>
          <strong>🔔 Parent Notification:</strong>
          <br />
          "Your child solved a division problem: {PROBLEM.question}"
        </p>
      </div>

      <div className="mt-6 rounded-xl border-2 border-blue-300 bg-blue-50 p-6">
        <h4 className="mb-3 text-lg font-bold text-gray-800">🌟 Ready for more?</h4>
        <p className="mb-4 text-gray-700">Try these similar problems to master division:</p>
        <div className="space-y-2">
          {PROBLEM.practiceProblems.map((practiceProblem) => (
            <div key={practiceProblem.question} className="flex items-center justify-between rounded-lg bg-white p-3">
              <span className="font-semibold text-gray-800">{practiceProblem.question}</span>
              <button
                type="button"
                onClick={() => alert(practiceProblem.hint)}
                className="rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try It
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <Celebration />

      <div className="mx-auto mb-6 max-w-3xl px-6">
        <div className="flex gap-2 overflow-x-auto rounded-xl bg-white p-3 shadow-md">
          {(
            [
              { label: "1. Question", state: "question" },
              { label: "2. Step-by-Step", state: "solving" },
              { label: "3. Practice", state: "practice" },
              { label: "4. Success", state: "success" },
            ] as Array<{ label: string; state: ViewState }>
          ).map(({ label, state }) => (
            <button
              key={state}
              type="button"
              onClick={() => setCurrentView(state)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                currentView === state ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {currentView === "question" && <QuestionView />}
      {currentView === "solving" && <SolvingView />}
      {currentView === "practice" && <PracticeView />}
      {currentView === "success" && <SuccessView />}
    </div>
  )
}
