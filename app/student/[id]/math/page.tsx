"use client"

import { use, useEffect, useRef, useState } from "react"
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

type ViewState = "question" | "solving" | "practice" | "success"

type Step = {
  title: string
  explanation: string
  visual: string
  tip: string
}

type PracticeProblem = {
  question: string
  answer: number
  hint: string
}

type Problem = {
  question: string
  difficulty: string
  type: string
  answer: number
  steps: Step[]
  realWorldExample: string
  practiceProblems: PracticeProblem[]
}

const PROBLEM: Problem = {
  question: "What is 234 ÷ 6?",
  difficulty: "medium",
  type: "division",
  answer: 39,
  steps: [
    {
      title: "Understand the problem",
      explanation: "We need to divide 234 by 6. This means: How many groups of 6 can we make from 234?",
      visual: "234 ÷ 6 = ?",
      tip: "Division means splitting into equal groups",
    },
    {
      title: "Set it up",
      explanation: "Let's write it like a division problem. We'll divide step by step.",
      visual: "6 ) 234",
      tip: "Start from the left side of the number",
    },
    {
      title: "Divide the first part",
      explanation:
        "How many 6s fit in 23? Let's count: 6×1=6, 6×2=12, 6×3=18, 6×4=24 (too big!)\nSo 3 times! Write 3 on top.",
      visual: "    3\n6 ) 234\n   -18\n    --\n     5",
      tip: "6 × 3 = 18, and 23 - 18 = 5",
    },
    {
      title: "Bring down the next digit",
      explanation: "Bring down the 4. Now we have 54.",
      visual: "    3\n6 ) 234\n   -18↓\n    --\n     54",
      tip: "Always bring down the next number",
    },
    {
      title: "Divide again",
      explanation: "How many 6s in 54? Let's see: 6×9=54. Exactly 9 times! Write 9 next to the 3.",
      visual: "    39\n6 ) 234\n   -18\n    --\n     54\n    -54\n    ---\n      0",
      tip: "6 × 9 = 54, perfect! No remainder!",
    },
    {
      title: "Check your answer",
      explanation: "Let's verify: 39 × 6 should equal 234.\n39 × 6 = (30 × 6) + (9 × 6) = 180 + 54 = 234 ✓",
      visual: "39 × 6 = 234 ✓",
      tip: "Always check by multiplying back!",
    },
  ],
  realWorldExample:
    "Imagine: You have 234 Leones and want to share equally among 6 friends. Each friend gets 39 Leones!",
  practiceProblems: [
    { question: "What is 144 ÷ 6?", answer: 24, hint: "Start with: How many 6s in 14?" },
    { question: "What is 156 ÷ 6?", answer: 26, hint: "Remember to bring down each digit" },
  ],
}

export default function MathSolvingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  void id

  const [currentView, setCurrentView] = useState<ViewState>("question")
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [problemsSolved, setProblemsSolved] = useState(15)
  const [showCelebration, setShowCelebration] = useState(false)
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleStepComplete = () => {
    if (currentStep < PROBLEM.steps.length - 1) {
      setCurrentStep((step) => step + 1)
    } else {
      setCurrentView("practice")
    }
  }

  const handleAnswerSubmit = () => {
    const parsed = Number.parseInt(userAnswer, 10)
    if (Number.isNaN(parsed)) {
      return
    }

    if (parsed === PROBLEM.answer) {
      setShowCelebration(true)
      setProblemsSolved((prev) => prev + 1)
      celebrationTimeoutRef.current = setTimeout(() => {
        setShowCelebration(false)
        setCurrentView("success")
      }, 1500)
    } else {
      alert("Not quite! Let's review the steps again.")
      setUserAnswer("")
      setCurrentStep(0)
      setCurrentView("solving")
    }
  }

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const Celebration = () =>
    showCelebration ? (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="text-9xl animate-ping">⭐</div>
      </div>
    ) : null

  const QuestionView = () => (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border-4 border-green-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            🤖
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">You asked Moe:</h3>
          <p className="mb-4 text-4xl font-bold text-green-600">{PROBLEM.question}</p>

          <div className="mb-6 inline-block rounded-full border-2 border-green-200 bg-green-50 px-6 py-3">
            <p className="text-sm text-gray-600">
              Difficulty: <span className="font-bold text-green-600">{PROBLEM.difficulty}</span>
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
          <div className="mb-3 flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            <p className="font-bold text-gray-800">Quick tip before we start:</p>
          </div>
          <p className="text-gray-700">
            Don&apos;t worry if it looks hard! Moe will break it into small, easy steps. You got this! 💪
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCurrentView("solving")
            setCurrentStep(0)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-4 text-lg font-bold text-white shadow-lg transition hover:from-green-600 hover:to-green-700 hover:shadow-xl"
        >
          Show Me How to Solve It!
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )

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
            onClick={() => alert("We&apos;ll add more problems soon!")}
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
