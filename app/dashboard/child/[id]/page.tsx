"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BookOpen, MessageSquare, Clock, Calendar } from "lucide-react"
import { QuestionsList } from "@/components/questions-list"
import { createBrowserClient } from "@/lib/supabase/client"

interface ChildData {
  id: string
  name: string
  age: number
  grade: string
  totalSessions: number
  hoursLearned: number
  lastActive: string
  weeklyProgress: number
  dailyGoalMinutes: number
  todayMinutes: number
  goalProgress: number
  recentActivities: Activity[]
  subjectProgress: SubjectProgress[]
  words: WordProgress[]
}

interface Activity {
  id: string
  type: "chat" | "reading" | "word"
  title: string
  duration: string
  date: string
  subject: string
  timestamp: number
}

interface SubjectProgress {
  subject: string
  progress: number
  sessions: number
  totalMinutes: number
}

interface WordProgress {
  id: string
  word: string
  definition: string | null
  exampleSentence: string | null
  pronunciation: string | null
  mastered: boolean
  timesReviewed: number
  lastReviewedAt: string | null
}

type StudySessionDuration = { duration_minutes: number | null }
type QuestionRow = { id: string; question_text: string; subject: string | null; created_at: string }
type ReadingRow = {
  id: string
  title: string | null
  duration_minutes: number | null
  comprehension_score: number | null
  created_at: string
}
type WordRow = {
  id: string
  word: string
  mastered: boolean | null
  times_reviewed: number | null
  last_reviewed_at: string | null
  definition: string | null
  example_sentence: string | null
  pronunciation: string | null
}
type PracticeSessionRow = { id: string; word: string; status: string | null; created_at: string }
type SubjectSessionRow = { subject: string | null; duration_minutes: number | null }

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [child, setChild] = useState<ChildData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [goalMinutes, setGoalMinutes] = useState<string>("")
  const [goalStatus, setGoalStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [showAllWords, setShowAllWords] = useState(false)

  useEffect(() => {
    async function fetchChildData() {
      try {
        const supabase = createBrowserClient()

        // Fetch student data
          const { data: studentData, error: studentError } = await supabase
            .from("students")
            .select("*")
            .eq("id", id)
          .maybeSingle()

        if (studentError || !studentData) {
          console.error("[v0] Error fetching student:", studentError)
          setIsLoading(false)
          return
        }

        const currentGoalMinutes = Number.isFinite(studentData.daily_study_goal_minutes)
          ? Number(studentData.daily_study_goal_minutes)
          : 30
        setGoalMinutes(String(currentGoalMinutes))
        setGoalStatus(null)

        // Get total sessions
        const { count: sessionsCount } = await supabase
          .from("study_sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", id)

        // Get total hours
        const { data: sessionsData } = await supabase
          .from("study_sessions")
          .select("duration_minutes")
          .eq("student_id", id)

        const totalMinutes = (sessionsData || []).reduce((sum: number, session: StudySessionDuration) => {
          return sum + (session.duration_minutes || 0)
        }, 0)
        const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const { data: todaySessions } = await supabase
          .from("study_sessions")
          .select("duration_minutes")
          .eq("student_id", id)
          .gte("started_at", startOfDay.toISOString())
          .lte("started_at", endOfDay.toISOString())

        const todayMinutes = (todaySessions || []).reduce((sum: number, session: StudySessionDuration) => {
          return sum + (session.duration_minutes || 0)
        }, 0)
        const goalProgress = currentGoalMinutes > 0 ? Math.min(Math.round((todayMinutes / currentGoalMinutes) * 100), 100) : 0

        // Get last activity
        const { data: lastSession } = await supabase
          .from("study_sessions")
          .select("started_at")
          .eq("student_id", id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const lastActive = lastSession && lastSession.started_at ? formatLastActive(new Date(lastSession.started_at)) : "No activity yet"

        // Calculate weekly progress
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const { count: weeklySessionsCount } = await supabase
          .from("study_sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", id)
          .gte("started_at", weekAgo.toISOString())

        const weeklyProgress = Math.min(Math.round(((weeklySessionsCount || 0) / 7) * 100), 100)

        // Fetch recent activities (questions and reading activities)
        const { data: questionsData } = await supabase
          .from("questions")
          .select("id, question_text, subject, created_at")
          .eq("student_id", id)
          .order("created_at", { ascending: false })
          .limit(3)

        const { data: readingData } = await supabase
          .from("reading_activities")
          .select("id, title, duration_minutes, comprehension_score, created_at")
          .eq("student_id", id)
          .order("created_at", { ascending: false })
          .limit(3)

        const { data: wordsData } = await supabase
          .from("words_learned")
          .select("id, word, mastered, times_reviewed, last_reviewed_at, definition, example_sentence, pronunciation")
          .eq("student_id", id)
          .order("last_reviewed_at", { ascending: false })

        const { data: practiceSessions } = await supabase
          .from("word_learning_sessions")
          .select("id, word, status, created_at")
          .eq("student_id", id)
          .order("created_at", { ascending: false })
          .limit(5)

        const recentActivities: Activity[] = [
          ...(questionsData || []).map((q: QuestionRow) => ({
            id: q.id,
            type: "chat" as const,
            title: q.question_text.length > 60 ? `${q.question_text.slice(0, 57)}...` : q.question_text,
            duration: "N/A",
            date: formatDate(new Date(q.created_at)),
            subject: q.subject || "General",
            timestamp: new Date(q.created_at).getTime(),
          })),
          ...(readingData || []).map((r: ReadingRow) => ({
            id: r.id,
            type: "reading" as const,
            title: r.title || "Reading Practice",
            duration: `${r.duration_minutes || 0} min • ${r.comprehension_score || 0}%`,
            date: formatDate(new Date(r.created_at)),
            subject: "Reading",
            timestamp: new Date(r.created_at).getTime(),
          })),
          ...(practiceSessions || []).map((session: PracticeSessionRow) => ({
            id: session.id,
            type: "word" as const,
            title: `Practiced "${session.word}"`,
            duration:
              session.status === "spell_mastered"
                ? "Spell It Out"
                : (session.status || "practice").replace(/_/g, " "),
            date: formatDate(new Date(session.created_at)),
            subject: "Vocabulary",
            timestamp: new Date(session.created_at).getTime(),
          })),
        ]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)

        const words: WordProgress[] = (wordsData || []).map((word: WordRow) => ({
          id: word.id,
          word: word.word,
          definition: word.definition ?? null,
          exampleSentence: word.example_sentence ?? null,
          pronunciation: word.pronunciation ?? null,
          mastered: Boolean(word.mastered),
          timesReviewed: word.times_reviewed || 0,
          lastReviewedAt: word.last_reviewed_at || null,
        }))

        // Calculate subject progress from study sessions
        const { data: subjectSessions } = await supabase
          .from("study_sessions")
          .select("subject, duration_minutes")
          .eq("student_id", id)

        const subjectMap = new Map<string, { minutes: number; sessions: number }>()
        subjectSessions?.forEach((session: SubjectSessionRow) => {
          const subject = session.subject || "General"
          const current = subjectMap.get(subject) || { minutes: 0, sessions: 0 }
          subjectMap.set(subject, {
            minutes: current.minutes + (session.duration_minutes || 0),
            sessions: current.sessions + 1,
          })
        })

        const subjectProgress: SubjectProgress[] = Array.from(subjectMap.entries()).map(([subject, data]) => ({
          subject,
          progress: Math.min(Math.round(((data.minutes || 0) / Math.max(currentGoalMinutes || 30, 10)) * 100), 100),
          sessions: data.sessions,
          totalMinutes: data.minutes,
        }))

        setChild({
          id: studentData.id,
          name: studentData.name,
          age: studentData.age,
          grade: studentData.grade,
          totalSessions: sessionsCount || 0,
          hoursLearned,
          lastActive,
          weeklyProgress,
          dailyGoalMinutes: currentGoalMinutes,
          todayMinutes,
          goalProgress,
          recentActivities,
          subjectProgress:
            subjectProgress.length > 0
              ? subjectProgress
              : [
                  { subject: "Mathematics", progress: 0, sessions: 0, totalMinutes: 0 },
                  { subject: "English", progress: 0, sessions: 0, totalMinutes: 0 },
                  { subject: "Reading", progress: 0, sessions: 0, totalMinutes: 0 },
                  { subject: "Science", progress: 0, sessions: 0, totalMinutes: 0 },
                ],
          words,
        })

        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching child data:", error)
        setIsLoading(false)
      }
    }

    fetchChildData()
  }, [id])

  function formatLastActive(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
  }

  function formatDate(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
  }

  const handleSaveGoal = async () => {
    const parsedGoal = Number(goalMinutes)

    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
      setGoalStatus({ type: "error", message: "Enter a goal greater than zero minutes." })
      return
    }

    if (parsedGoal > 240) {
      setGoalStatus({ type: "error", message: "Let's keep goals under 4 hours per day." })
      return
    }

    try {
      setIsSavingGoal(true)
      setGoalStatus(null)

      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("students")
        .update({ daily_study_goal_minutes: parsedGoal })
        .eq("id", id)

      if (error) {
        throw error
      }

      setChild((previous) => (previous ? { ...previous, dailyGoalMinutes: parsedGoal } : previous))
      setGoalMinutes(String(parsedGoal))
      setGoalStatus({ type: "success", message: `Daily goal updated to ${parsedGoal} minutes.` })
    } catch (error) {
      console.error("[v0] Failed to save study goal:", error)
      setGoalStatus({ type: "error", message: "Couldn't save that goal. Try again in a moment." })
    } finally {
      setIsSavingGoal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Child not found</p>
      </div>
    )
  }

  const firstName = child.name.split(" ")[0] ?? child.name
  const goalEncouragement = child.goalProgress >= 100
    ? `${firstName} hit today's goal. Brilliant focus!`
    : child.goalProgress >= 70
      ? `${firstName} is close—just ${Math.max(child.dailyGoalMinutes - child.todayMinutes, 0)} more minute${Math.max(child.dailyGoalMinutes - child.todayMinutes, 0) === 1 ? "" : "s"}.`
      : child.todayMinutes === 0
        ? `${firstName} hasn't started yet. A quick session keeps the streak alive.`
        : `${firstName} logged ${child.todayMinutes} minute${child.todayMinutes === 1 ? "" : "s"} so far. Keep cheering!`

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Child Profile Header */}
        <Card className="mb-8 border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarFallback className="bg-primary/10 font-bold text-2xl text-primary">
                    {child.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="mb-1 font-bold text-3xl">{child.name}</h1>
                  <p className="mb-2 text-muted-foreground text-lg">
                    {child.age} years old • {child.grade}
                  </p>
                  <Badge variant="secondary" className="font-semibold">
                    Last active: {child.lastActive}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="font-bold text-3xl text-primary">{child.totalSessions}</p>
                  <p className="text-muted-foreground text-sm">Total Sessions</p>
                </div>
                <div>
                  <p className="font-bold text-3xl text-secondary">{child.hoursLearned}h</p>
                  <p className="text-muted-foreground text-sm">Hours Learned</p>
                </div>
                <div>
                  <p className="font-bold text-3xl text-accent">{child.weeklyProgress}%</p>
                  <p className="text-muted-foreground text-sm">Weekly Progress</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div>
              <h2 className="font-bold text-2xl">Daily Study Goal</h2>
              <p className="text-muted-foreground text-sm">
                Set how many minutes {child.name.split(" ")[0]} should practice each day. Moe will use this target when tracking streaks.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-44">
                <Label htmlFor="daily-goal">Minutes per day</Label>
                <Input
                  id="daily-goal"
                  type="number"
                  min={5}
                  step={5}
                  value={goalMinutes}
                  onChange={(event) => setGoalMinutes(event.target.value)}
                  placeholder="30"
                />
              </div>
              <Button
                onClick={() => void handleSaveGoal()}
                disabled={isSavingGoal}
                className="sm:w-auto"
              >
                {isSavingGoal ? "Saving..." : "Save goal"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setGoalMinutes(String(child.dailyGoalMinutes))
                  setGoalStatus(null)
                }}
                className="sm:w-auto"
              >
                Reset
              </Button>
            </div>
            {goalStatus ? (
              <p
                className={`text-sm ${goalStatus.type === "success" ? "text-emerald-600" : "text-red-600"}`}
              >
                {goalStatus.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Current goal: {child.dailyGoalMinutes} minute{child.dailyGoalMinutes === 1 ? "" : "s"} per day
              </p>
            )}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Today</p>
                <span className="text-sm text-muted-foreground">
                  {child.todayMinutes} / {child.dailyGoalMinutes} min
                </span>
              </div>
              <Progress value={child.goalProgress} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">{goalEncouragement}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Subject Progress */}
          <div>
            <h2 className="mb-4 font-bold text-2xl">Subject Progress</h2>
            <Card className="border-2">
              <CardContent className="space-y-6 pt-6">
                {child.subjectProgress.map((subject) => (
                  <div key={subject.subject}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-base">{subject.subject}</p>
                        <p className="text-muted-foreground text-sm">
                          {subject.sessions} session{subject.sessions === 1 ? "" : "s"} • {subject.totalMinutes} min
                        </p>
                      </div>
                      <span className="font-bold text-lg">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="mb-4 font-bold text-2xl">Recent Activities</h2>
            <Card className="border-2">
              <CardContent className="space-y-4 pt-6">
                {child.recentActivities.length > 0 ? (
                  (showAllActivities ? child.recentActivities : child.recentActivities.slice(0, 4)).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                          activity.type === "chat"
                            ? "bg-primary/10"
                            : activity.type === "word"
                              ? "bg-emerald-100"
                              : "bg-secondary/10"
                        }`}
                      >
                        {activity.type === "chat" ? (
                          <MessageSquare className="h-6 w-6 text-primary" />
                        ) : activity.type === "word" ? (
                          <BookOpen className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-start justify-between">
                          <h3 className="font-semibold text-base">{activity.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {activity.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-sm">
                          {activity.duration !== "N/A" && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.duration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {activity.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-muted-foreground">No recent activities</p>
                )}
              </CardContent>
            </Card>
            {child.recentActivities.length > 4 ? (
              <div className="mt-3 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllActivities((previous) => !previous)}
                >
                  {showAllActivities ? "Show less" : "Show more"}
                </Button>
              </div>
            ) : null}
            <div className="mt-8">
              <h2 className="mb-4 font-bold text-2xl">Word Bank</h2>
              <Card className="border-2">
                <CardContent className="space-y-4 pt-6">
                  {child.words.length > 0 ? (
                    (showAllWords ? child.words : child.words.slice(0, 4)).map((word) => {
                      const reviewedDate = word.lastReviewedAt ? new Date(word.lastReviewedAt) : null
                      return (
                        <div key={word.id} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-lg capitalize text-emerald-800">{word.word}</p>
                            <Badge
                              variant={word.mastered ? "secondary" : "outline"}
                              className={word.mastered ? "bg-emerald-500 text-white" : "text-emerald-700"}
                            >
                              {word.mastered ? "Mastered" : "Review"}
                            </Badge>
                          </div>
                          {word.definition ? (
                            <p className="mt-2 text-sm text-muted-foreground">{word.definition}</p>
                          ) : word.exampleSentence ? (
                            <p className="mt-2 text-sm text-muted-foreground">{word.exampleSentence}</p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Reviews: {word.timesReviewed}</span>
                            {reviewedDate ? <span>Last practiced: {formatDate(reviewedDate)}</span> : null}
                            {word.pronunciation ? <span>Pronunciation: {word.pronunciation}</span> : null}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">No words learned yet.</p>
                  )}
                </CardContent>
              </Card>
              {child.words.length > 4 ? (
                <div className="mt-3 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllWords((previous) => !previous)}
                  >
                    {showAllWords ? "Show less" : "Show more"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 font-bold text-2xl">Questions Asked</h2>
          <QuestionsList studentId={id} />
        </div>
      </main>
    </div>
  )
}
