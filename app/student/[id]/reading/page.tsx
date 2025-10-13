"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

// Sample reading passages
interface ReadingPassage {
  id: string
  title: string
  level: string
  text: string
  questions: {
    question: string
    options: string[]
    correct: number
  }[]
}

type ReadingStage = "select" | "reading" | "questions" | "results"

export default function ReadingPracticePage({ params }: { params: { id: string } }) {
  const [stage, setStage] = useState<ReadingStage>("select")
  const [passages, setPassages] = useState<ReadingPassage[]>([])
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPassages()
  }, [])

  const loadPassages = async () => {
    try {
      const supabase = createBrowserClient()

      // Fetch reading passages from database
      const { data, error } = await supabase.from("reading_passages").select("*").order("level", { ascending: true })

      if (error) {
        console.error("[v0] Error loading passages:", error)
        // If table doesn't exist yet, use sample data
        setPassages(getSamplePassages())
      } else if (data && data.length > 0) {
        setPassages(data)
      } else {
        // No passages in database, use sample data
        setPassages(getSamplePassages())
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      setPassages(getSamplePassages())
    } finally {
      setIsLoading(false)
    }
  }

  // Sample passages as fallback
  const getSamplePassages = (): ReadingPassage[] => [
    {
      id: "1",
      title: "The Clever Tortoise",
      level: "Beginner",
      text: `Once upon a time, there was a clever tortoise who lived near a big river. All the animals in the forest knew the tortoise was very wise.

One day, the animals had a problem. The river was too wide to cross, and they needed to get to the other side where the best fruit trees grew.

The tortoise thought carefully. Then he had an idea! He asked all the birds to bring stones and drop them in the river. Day by day, the stones piled up until they made a bridge.

All the animals were happy. They could now cross the river safely. The tortoise smiled, knowing that working together made them stronger.`,
      questions: [
        {
          question: "Where did the tortoise live?",
          options: ["In a tree", "Near a big river", "In the mountains", "In a cave"],
          correct: 1,
        },
        {
          question: "What was the animals' problem?",
          options: ["They were hungry", "The river was too wide to cross", "They had no water", "They were lost"],
          correct: 1,
        },
        {
          question: "How did the tortoise solve the problem?",
          options: [
            "He swam across",
            "He built a boat",
            "He asked birds to bring stones to make a bridge",
            "He found another path",
          ],
          correct: 2,
        },
      ],
    },
    {
      id: "2",
      title: "Market Day in Freetown",
      level: "Intermediate",
      text: `Every Saturday, the big market in Freetown comes alive with colors, sounds, and delicious smells. Vendors arrange their goods carefully - bright fabrics, fresh vegetables, and handmade crafts.

Mariama helps her mother sell vegetables at the market. She has learned to count money quickly and speak politely to customers. Her favorite part is meeting people from different parts of the city.

Today, a tourist asked Mariama about the best local fruits. She proudly explained about mangoes, pineapples, and sweet oranges. The tourist was impressed by her knowledge and bought a large basket of fruit.

Mariama's mother smiled. She knew her daughter was learning important skills that would help her in the future. Hard work and good communication were valuable lessons.`,
      questions: [
        {
          question: "When does the big market happen?",
          options: ["Every day", "Every Saturday", "Every Sunday", "Once a month"],
          correct: 1,
        },
        {
          question: "What does Mariama sell at the market?",
          options: ["Fabrics", "Vegetables", "Crafts", "Fruits only"],
          correct: 1,
        },
        {
          question: "What skills is Mariama learning?",
          options: [
            "Cooking and cleaning",
            "Reading and writing",
            "Counting money and communication",
            "Singing and dancing",
          ],
          correct: 2,
        },
      ],
    },
  ]

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSelectPassage = (passage: ReadingPassage) => {
    setSelectedPassage(passage)
    setStage("reading")
    setTimeElapsed(0)
    setIsTimerRunning(true)
    setAnswers([])
  }

  const handleFinishReading = () => {
    setIsTimerRunning(false)
    setStage("questions")
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleSubmitAnswers = async () => {
    if (!selectedPassage) return

    let correctCount = 0
    selectedPassage.questions.forEach((q, index) => {
      if (answers[index] === q.correct) {
        correctCount++
      }
    })

    setScore(correctCount)
    setStage("results")

    try {
      const supabase = createBrowserClient()

      await supabase.from("reading_activities").insert({
        student_id: params.id,
        passage_id: selectedPassage.id,
        time_spent_seconds: timeElapsed,
        comprehension_score: Math.round((correctCount / selectedPassage.questions.length) * 100),
        answers_data: {
          answers: answers,
          correct: correctCount,
          total: selectedPassage.questions.length,
        },
      })

      console.log("[v0] Reading session saved successfully")
    } catch (error) {
      console.error("[v0] Error saving reading session:", error)
    }
  }

  const handleRestart = () => {
    setStage("select")
    setSelectedPassage(null)
    setTimeElapsed(0)
    setIsTimerRunning(false)
    setAnswers([])
    setScore(0)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <p className="font-semibold text-lg">Loading passages...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-white/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/student/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="font-bold text-xl">Reading Practice</h1>
          {stage === "reading" || stage === "questions" ? (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 font-semibold text-base">
              <Clock className="h-4 w-4" />
              {formatTime(timeElapsed)}
            </Badge>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Select Passage Stage */}
        {stage === "select" && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-bold text-3xl">Choose a Story to Read</h2>
              <p className="text-muted-foreground text-lg">Pick a story and test your reading comprehension!</p>
            </div>

            {passages.length === 0 ? (
              <Card className="border-2 p-8 text-center">
                <p className="text-muted-foreground">No reading passages available yet. Check back soon!</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {passages.map((passage) => (
                  <Card key={passage.id} className="border-2 transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-2 flex items-center justify-between">
                        <CardTitle className="text-xl">{passage.title}</CardTitle>
                        <Badge variant="outline">{passage.level}</Badge>
                      </div>
                      <CardDescription className="text-base">
                        {passage.questions.length} comprehension questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => handleSelectPassage(passage)} className="w-full font-semibold" size="lg">
                        Start Reading
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reading Stage */}
        {stage === "reading" && selectedPassage && (
          <div>
            <Card className="mb-6 border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{selectedPassage.title}</CardTitle>
                  <Badge variant="secondary">{selectedPassage.level}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  {selectedPassage.text.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 text-base leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button onClick={handleFinishReading} size="lg" className="font-semibold">
                I Finished Reading
              </Button>
            </div>
          </div>
        )}

        {/* Questions Stage */}
        {stage === "questions" && selectedPassage && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="mb-2 font-bold text-2xl">Answer These Questions</h2>
              <p className="text-muted-foreground">Think carefully about what you just read!</p>
            </div>

            <div className="space-y-6">
              {selectedPassage.questions.map((question, qIndex) => (
                <Card key={qIndex} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {qIndex + 1}: {question.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                          answers[qIndex] === oIndex
                            ? "border-primary bg-primary/10 font-semibold"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button
                onClick={handleSubmitAnswers}
                size="lg"
                className="font-semibold"
                disabled={answers.length !== selectedPassage.questions.length}
              >
                Submit Answers
              </Button>
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === "results" && selectedPassage && (
          <div>
            <Card className="border-2">
              <CardHeader className="text-center">
                <div
                  className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${
                    score === selectedPassage.questions.length ? "bg-accent/20" : "bg-primary/20"
                  }`}
                >
                  {score === selectedPassage.questions.length ? (
                    <CheckCircle2 className="h-12 w-12 text-accent" />
                  ) : (
                    <span className="font-bold text-4xl text-primary">
                      {score}/{selectedPassage.questions.length}
                    </span>
                  )}
                </div>
                <CardTitle className="text-3xl">
                  {score === selectedPassage.questions.length
                    ? "Perfect Score!"
                    : score >= selectedPassage.questions.length / 2
                      ? "Good Job!"
                      : "Keep Practicing!"}
                </CardTitle>
                <CardDescription className="text-lg">
                  You got {score} out of {selectedPassage.questions.length} questions correct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Score</span>
                    <span className="font-semibold">
                      {Math.round((score / selectedPassage.questions.length) * 100)}%
                    </span>
                  </div>
                  <Progress value={(score / selectedPassage.questions.length) * 100} className="h-3" />
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Time Taken</span>
                    <span className="font-semibold">{formatTime(timeElapsed)}</span>
                  </div>
                </div>

                {/* Answer Review */}
                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-lg">Answer Review</h3>
                  {selectedPassage.questions.map((question, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-start gap-2">
                        {answers[index] === question.correct ? (
                          <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                        ) : (
                          <XCircle className="mt-1 h-5 w-5 flex-shrink-0 text-destructive" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{question.question}</p>
                          <p className="mt-1 text-accent text-sm">Correct: {question.options[question.correct]}</p>
                          {answers[index] !== question.correct && (
                            <p className="text-destructive text-sm">Your answer: {question.options[answers[index]]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleRestart} variant="outline" className="flex-1 font-semibold bg-transparent">
                    Try Another Story
                  </Button>
                  <Button asChild className="flex-1 font-semibold">
                    <Link href={`/student/${params.id}`}>Back to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
