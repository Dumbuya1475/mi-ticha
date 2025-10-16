"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Sparkles, BookOpen, Trophy, Play, Square } from "lucide-react"
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

const readingIllustration = "/assets/img4.png"
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const estimateReadingMinutes = (text: string) => Math.max(1, Math.ceil(countWords(text) / 120) || 1)

export default function ReadingPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [practiceMode, setPracticeMode] = useState<"comprehension" | "fluency">("comprehension")
  const [stage, setStage] = useState<ReadingStage>("select")
  const [passages, setPassages] = useState<ReadingPassage[]>([])
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [isFluencyReading, setIsFluencyReading] = useState(false)
  const [fluencyStartTime, setFluencyStartTime] = useState<number | null>(null)
  const [fluencyElapsedTime, setFluencyElapsedTime] = useState(0)
  const [fluencyResult, setFluencyResult] = useState<
    | {
        wordCount: number
        timeSeconds: number
        wpm: number
        timeDisplay: string
      }
    | null
  >(null)
  const [fluencySelectedWord, setFluencySelectedWord] = useState<string | null>(null)

  useEffect(() => {
    loadPassages()
  }, [])

  useEffect(() => {
    if (practiceMode === "comprehension") {
      setStage("select")
      setSelectedPassage(null)
      setTimeElapsed(0)
      setIsTimerRunning(false)
      setAnswers([])
      setScore(0)
    } else {
      setDifficulty("easy")
      setIsFluencyReading(false)
      setFluencyStartTime(null)
      setFluencyElapsedTime(0)
      setFluencyResult(null)
      setFluencySelectedWord(null)
    }
  }, [practiceMode])

  const loadPassages = async () => {
    try {
      const supabase = createBrowserClient()

      // Fetch reading passages from database
      const { data, error } = await supabase.from("reading_passages").select("*").order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error loading passages:", error)
        // If table doesn't exist yet, use sample data
        setPassages(getSamplePassages())
      } else if (data && data.length > 0) {
        const fallbackPassages = getSamplePassages()
        const mappedPassages: ReadingPassage[] = data.map((passage, index) => {
          const fallback = fallbackPassages[index % fallbackPassages.length]
          const difficulty = (passage as any).difficulty_level || (passage as any).level || fallback.level
          const content = (passage as any).text || (passage as any).content || fallback.text
          const questions = Array.isArray((passage as any).questions) && (passage as any).questions.length > 0
            ? (passage as any).questions
            : fallback.questions

          return {
            id: passage.id,
            title: passage.title || fallback.title,
            level: typeof difficulty === "string" ? capitalizeFirstLetter(difficulty) : fallback.level,
            text: content,
            questions,
          }
        })

        setPassages(mappedPassages)
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

  const capitalizeFirstLetter = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)

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

  useEffect(() => {
    if (!isFluencyReading || !fluencyStartTime) return

    const interval = setInterval(() => {
      setFluencyElapsedTime(Math.floor((Date.now() - fluencyStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isFluencyReading, fluencyStartTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFluencyTime = formatTime

  const fluencyPassages: Record<"easy" | "medium" | "hard", string> = {
    easy: "The sun is bright today. Birds sing in the trees. I see a mango tree. The mangoes are yellow and sweet. My mother will make mango juice.",
    medium:
      "In Sierra Leone, cassava is an important food. Farmers grow it in their fields. The roots grow underground. When harvest time comes, families dig up the cassava. They use it to make different foods like fufu and gari.",
    hard:
      "Photosynthesis is the process plants use to make food. They take carbon dioxide from the air and water from the soil. Using energy from sunlight, they create glucose and release oxygen. This process is essential for all life on Earth.",
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
  const durationMinutes = Math.max(1, Math.round(timeElapsed / 60) || 1)
  const totalWords = countWords(selectedPassage.text)

      const { error: readingError } = await supabase.from("reading_activities").insert({
        student_id: id,
        passage_id: isUuid(selectedPassage.id) ? selectedPassage.id : null,
        title: selectedPassage.title,
        duration_minutes: durationMinutes,
        comprehension_score: Math.round((correctCount / selectedPassage.questions.length) * 100),
        words_read: totalWords,
      })

      if (readingError) {
        throw readingError
      }

      const { error: sessionError } = await supabase.from("study_sessions").insert({
        student_id: id,
        subject: "Reading",
        duration_minutes: durationMinutes,
        questions_answered: selectedPassage.questions.length,
        questions_correct: correctCount,
      })

      if (sessionError) {
        throw sessionError
      }

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

  const handleStartFluency = () => {
    setIsFluencyReading(true)
    setFluencyStartTime(Date.now())
    setFluencyElapsedTime(0)
    setFluencyResult(null)
    setFluencySelectedWord(null)
  }

  const calculateFluencyResults = (elapsedSeconds: number) => {
    const passage = fluencyPassages[difficulty]
    const wordCount = countWords(passage)
    const timeInMinutes = Math.max(elapsedSeconds / 60, 0.1)
    const wpm = Math.round(wordCount / timeInMinutes)

    setFluencyResult({
      wordCount,
      timeSeconds: elapsedSeconds,
      wpm,
      timeDisplay: formatFluencyTime(elapsedSeconds),
    })
  }

  const logFluencyPronunciation = useCallback(
    async (word: string) => {
      const normalized = word?.trim()

      if (!normalized) {
        return
      }

      try {
        await fetch("/api/word-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: normalized,
            studentId: id,
            status: "pronounced",
            payload: {
              source: "reading_fluency",
              difficulty,
            },
          }),
        })
      } catch (error) {
        console.error("[v0] Failed to log reading pronunciation:", error)
      }
    },
    [difficulty, id],
  )

  const handleStopFluency = () => {
    setIsFluencyReading(false)
    const elapsedSeconds = fluencyElapsedTime
    calculateFluencyResults(elapsedSeconds === 0 ? 1 : elapsedSeconds)
  }

  const handleFluencyWordClick = (word: string) => {
    setFluencySelectedWord(word)

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8
      utterance.pitch = 1.1
      window.speechSynthesis.speak(utterance)
    }

    void logFluencyPronunciation(word)
  }

  const handleFluencyReset = () => {
    setFluencyResult(null)
    setIsFluencyReading(false)
    setFluencyStartTime(null)
    setFluencyElapsedTime(0)
    setFluencySelectedWord(null)
  }

  const fluencyWords = fluencyPassages[difficulty].split(/\s+/)

  const headerTitle = practiceMode === "comprehension" ? "Reading Adventure" : "Fluency Sprint"

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
            <Link href={`/student/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="font-bold text-xl">{headerTitle}</h1>
          {practiceMode === "comprehension" && (stage === "reading" || stage === "questions") ? (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 font-semibold text-base">
              <Clock className="h-4 w-4" />
              {formatTime(timeElapsed)}
            </Badge>
          ) : practiceMode === "fluency" && isFluencyReading ? (
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 font-semibold text-base">
              <Clock className="h-4 w-4" />
              {formatFluencyTime(fluencyElapsedTime)}
            </Badge>
          ) : (
            <div className="w-20" />
          )}
        </div>
        <div className="mx-auto mt-4 max-w-4xl">
          <Tabs value={practiceMode} onValueChange={(value) => setPracticeMode(value as "comprehension" | "fluency")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comprehension">Story & Questions</TabsTrigger>
              <TabsTrigger value="fluency">Timed Reading</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {practiceMode === "comprehension" && stage === "select" && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,320px)]">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/80 p-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_65%)]" />
                <div className="relative z-10 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Reading Adventure Mode
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-black text-3xl leading-tight sm:text-4xl">Pick a story, earn stars, and grow your reading power!</h2>
                    <p className="text-white/90 text-lg">
                      Each story unlocks questions and fun challenges. Finish a passage to keep your streak alive and make Moe proud!
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/15 p-4">
                      <h3 className="flex items-center gap-2 font-semibold text-lg">
                        <BookOpen className="h-5 w-5" /> Story Library
                      </h3>
                      <p className="mt-1 text-sm text-white/80">Select any level and race the timer while you read.</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 p-4">
                      <h3 className="flex items-center gap-2 font-semibold text-lg">
                        <Trophy className="h-5 w-5" /> Earn Streak Points
                      </h3>
                      <p className="mt-1 text-sm text-white/80">Complete a passage daily to boost your streak counter.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative min-h-[260px] overflow-hidden rounded-3xl border-4 border-white/70 shadow-xl">
                <Image
                  src={readingIllustration}
                  alt="Illustration of a child reading a storybook"
                  fill
                  sizes="(min-width: 1024px) 320px, 60vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {passages.length === 0 ? (
              <Card className="border-2 p-8 text-center">
                <p className="text-muted-foreground">No reading passages available yet. Check back soon!</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {passages.map((passage) => (
                  <Card key={passage.id} className="group border-2 border-border/60 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-2xl">
                    <CardHeader>
                      <div className="mb-3 flex items-center justify-between">
                        <CardTitle className="font-semibold text-xl">{passage.title}</CardTitle>
                        <Badge className="border-none bg-primary/10 px-3 py-1 font-semibold text-primary">{passage.level}</Badge>
                      </div>
                      <CardDescription className="text-base text-muted-foreground">
                        {passage.questions.length} comprehension questions • {estimateReadingMinutes(passage.text)} min read
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Explore themes of teamwork, courage, and real-life adventures inspired by Sierra Leone.
                      </p>
                      <Button
                        onClick={() => handleSelectPassage(passage)}
                        className="w-full font-semibold"
                        size="lg"
                      >
                        Start Reading
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {practiceMode === "comprehension" && stage === "reading" && selectedPassage && (
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

        {practiceMode === "comprehension" && stage === "questions" && selectedPassage && (
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

        {practiceMode === "comprehension" && stage === "results" && selectedPassage && (
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
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Your Score</span>
                    <span className="font-semibold">
                      {Math.round((score / selectedPassage.questions.length) * 100)}%
                    </span>
                  </div>
                  <Progress value={(score / selectedPassage.questions.length) * 100} className="h-3" />
                  <div className="grid gap-3 rounded-lg bg-muted p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-sm">Words Read</p>
                      <p className="font-semibold text-lg">{countWords(selectedPassage.text)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Time Taken</p>
                      <p className="font-semibold text-lg">{formatTime(timeElapsed)}</p>
                    </div>
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
                    <Link href={`/student/${id}`}>Back to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {practiceMode === "fluency" && (
          <div className="space-y-8">
            <div className="bg-white/60 rounded-3xl border-2 border-border/60 p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="font-bold text-2xl">Timed Reading Coach</h2>
                    <p className="text-muted-foreground text-sm">Choose your level, read aloud, and watch your speed improve.</p>
                  </div>
                </div>
                {isFluencyReading && (
                  <div className="flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-2">
                    <Clock className="h-5 w-5 text-secondary" />
                    <span className="font-mono text-lg font-semibold text-secondary">{formatFluencyTime(fluencyElapsedTime)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {(Object.keys(fluencyPassages) as Array<"easy" | "medium" | "hard">).map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? "default" : "outline"}
                    onClick={() => setDifficulty(level)}
                    disabled={isFluencyReading}
                    className={`capitalize ${isFluencyReading ? "opacity-60" : ""}`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                {!isFluencyReading && !fluencyResult && (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground mb-6">Click start when you're ready to read. Tap any word to hear it aloud.</p>
                    <Button onClick={handleStartFluency} size="lg" className="mx-auto flex items-center gap-3">
                      <Play className="h-5 w-5" />
                      Start Reading
                    </Button>
                  </div>
                )}

                {isFluencyReading && (
                  <div>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      {fluencyWords.map((word, index) => (
                        <button
                          key={`${word}-${index}`}
                          onClick={() => handleFluencyWordClick(word)}
                          className="rounded px-1 hover:bg-secondary/20 hover:text-primary"
                          type="button"
                          title="Click to hear pronunciation"
                        >
                          {word}{" "}
                        </button>
                      ))}
                    </p>
                    <div className="mt-8 border-t pt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">When you finish reading, stop the timer.</p>
                      <Button onClick={handleStopFluency} variant="destructive" size="lg" className="mx-auto flex items-center gap-3">
                        <Square className="h-5 w-5" />
                        I'm Done Reading
                      </Button>
                    </div>
                  </div>
                )}

                {fluencyResult && (
                  <div className="space-y-6 text-center">
                    <div className="rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
                      <h3 className="font-bold text-3xl mb-4">Great Job! 🎉</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                          <p className="text-xs text-muted-foreground uppercase">Words</p>
                          <p className="font-bold text-3xl text-primary">{fluencyResult.wordCount}</p>
                        </div>
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                          <p className="text-xs text-muted-foreground uppercase">Time</p>
                          <p className="font-bold text-3xl text-secondary">{fluencyResult.timeDisplay}</p>
                        </div>
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                          <p className="text-xs text-muted-foreground uppercase">Speed</p>
                          <p className="font-bold text-3xl text-accent">{fluencyResult.wpm}</p>
                          <p className="text-muted-foreground text-xs">words per minute</p>
                        </div>
                      </div>
                      <div className="mt-6 rounded-xl bg-white p-5 text-muted-foreground">
                        {fluencyResult.wpm >= 100 ? (
                          <p>✨ Fantastic speed! Keep challenging yourself with harder passages.</p>
                        ) : fluencyResult.wpm >= 60 ? (
                          <p>📖 Nice work! Practice a little each day to boost your pace.</p>
                        ) : (
                          <p>📚 Steady progress! Read along with the recording to grow your confidence.</p>
                        )}
                      </div>
                    </div>
                    <Button onClick={handleFluencyReset} size="lg" className="mx-auto">
                      Practice Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {fluencySelectedWord && (
              <Card className="border-2 border-yellow-300 bg-white">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">{fluencySelectedWord}</CardTitle>
                  <button
                    onClick={() => setFluencySelectedWord(null)}
                    className="text-muted-foreground text-2xl leading-none"
                    type="button"
                  >
                    ×
                  </button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>🔊 Click the word again to hear it pronounced.</p>
                  <p>In a real lesson, Moe would share the meaning and an example sentence here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
