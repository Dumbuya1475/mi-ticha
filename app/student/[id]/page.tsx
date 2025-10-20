"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { MessageSquare, BookOpen, Trophy, Clock, LogOut, Volume2, Calculator, BookMarked, Target } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Student {
  id: string
  name: string
  age: number
  grade_level: string
  daily_study_goal_minutes: number | null
}

export default function StudentHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [stats, setStats] = useState({ streak: 0, totalSessions: 0 })
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30)
  const [todayMinutes, setTodayMinutes] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const studentId = localStorage.getItem("studentId")

      // First check localStorage for quick validation
      if (!studentId || studentId !== id) {
        console.log("[v0] Student not authenticated in localStorage, redirecting to login")
        router.push("/student-login")
        return
      }

      // Then verify Supabase Auth session
      const supabase = createBrowserClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        console.log("[v0] No valid Supabase session, redirecting to login")
        localStorage.removeItem("studentId")
        localStorage.removeItem("studentName")
        router.push("/student-login")
        return
      }

      // Both checks passed, load student data
      loadStudentData()
    }

    checkAuth()
  }, [id, router])

  const loadStudentData = async () => {
    try {
      const supabase = createBrowserClient()

      // Load student info
      const { data: studentData, error: studentError } = await supabase
        .from("students")
  .select("id, name, age, grade_level, daily_study_goal_minutes")
        .eq("id", id)
        .maybeSingle()

      if (studentError) {
        console.error("[v0] Error loading student:", studentError)
        // Log structured details to help diagnose HTTP errors (e.g. 406 Not Acceptable)
        try {
          console.error("[v0] Student error details:", {
            status: (studentError as any)?.status,
            message: (studentError as any)?.message,
            details: (studentError as any)?.details,
            hint: (studentError as any)?.hint,
          })
          // Also attempt to stringify for any nested fields
          console.debug("[v0] Full studentError object:", JSON.stringify(studentError, Object.getOwnPropertyNames(studentError), 2))
        } catch (e) {
          console.error("[v0] Failed to stringify studentError:", e)
        }

        router.push("/student-login")
        return
      }

      setStudent(studentData)
      const configuredGoal = Number.isFinite(studentData?.daily_study_goal_minutes)
        ? Number(studentData.daily_study_goal_minutes)
        : 30
      setDailyGoalMinutes(configuredGoal > 0 ? configuredGoal : 30)

      // Calculate learning streak (consecutive days with activity) using study sessions
      const { data: recentSessions } = await supabase
        .from("study_sessions")
        .select("started_at, duration_minutes")
        .eq("student_id", id)
        .order("started_at", { ascending: false })
        .limit(60)

      let streak = 0
      const activityDates = new Set<number>()

      if (recentSessions && recentSessions.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        recentSessions.forEach((session: { started_at: string | null; duration_minutes: number | null }) => {
          if (!session.started_at) return
          const date = new Date(session.started_at)
          date.setHours(0, 0, 0, 0)
          activityDates.add(date.getTime())
        })

        let currentDate = today.getTime()
        while (activityDates.has(currentDate)) {
          streak++
          currentDate -= 24 * 60 * 60 * 1000
        }
      }

      // Calculate total sessions (distinct days with activity)
      const { data: allSessions } = await supabase
        .from("study_sessions")
        .select("started_at, duration_minutes")
        .eq("student_id", id)

      const totalSessions = allSessions
        ? new Set(
            allSessions
              .map((session: { started_at: string | null; duration_minutes: number | null }) => {
                if (!session.started_at) {
                  return null
                }

                return new Date(session.started_at).toDateString()
              })
              .filter((dateString: string | null): dateString is string => Boolean(dateString)),
          ).size
        : 0

      if (allSessions && allSessions.length > 0) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const minutesToday = allSessions.reduce((sum: number, session: { started_at: string | null; duration_minutes: number | null }) => {
          if (!session.started_at) {
            return sum
          }
          const startedAt = new Date(session.started_at)
          if (startedAt >= todayStart && startedAt < todayEnd) {
            return sum + (Number(session.duration_minutes) || 0)
          }
          return sum
        }, 0)

        setTodayMinutes(minutesToday)
      } else {
        setTodayMinutes(0)
      }

      setStats({ streak, totalSessions })
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("studentId")
    localStorage.removeItem("studentName")
    router.push("/student-login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1e1b4b,_#5b21b6_45%,_#ec4899_85%)]">
        <p className="font-semibold text-lg text-white">Loading...</p>
      </div>
    )
  }

  if (!student) {
    return null
  }

  const normalizedGoal = dailyGoalMinutes > 0 ? dailyGoalMinutes : 30
  const goalProgress = normalizedGoal > 0 ? Math.min((todayMinutes / normalizedGoal) * 100, 100) : 0
  const goalRemaining = Math.max(Math.round(normalizedGoal - todayMinutes), 0)
  const goalMet = normalizedGoal > 0 && goalRemaining === 0
  const goalMessage = goalMet
    ? "Amazing! You already met today’s goal—anything extra is bonus practice."
    : `Only ${goalRemaining} more minute${goalRemaining === 1 ? "" : "s"} to reach today’s goal.`

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e1b4b,_#5b21b6_45%,_#ec4899_85%)]">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-white">
              <AvatarFallback className="bg-white font-bold text-lg text-primary">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-2xl text-white">Hi, {student.name}!</h1>
              <p className="text-sm text-white/90">{student.grade_level}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 border-white/20 bg-white/95 backdrop-blur-sm">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="mb-1 text-muted-foreground text-sm">Learning Streak</p>
                <p className="font-bold text-3xl text-primary">{stats.streak} days</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-white/20 bg-white/95 backdrop-blur-sm">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="mb-1 text-muted-foreground text-sm">Total Sessions</p>
                <p className="font-bold text-3xl text-secondary">{stats.totalSessions}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                <Clock className="h-7 w-7 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-white/20 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-muted-foreground text-sm">Today&apos;s Minutes</p>
                  <p className="font-bold text-3xl text-rose-600">
                    {Math.round(todayMinutes)}/{normalizedGoal}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                  <Target className="h-7 w-7 text-rose-600" />
                </div>
              </div>
              <Progress value={goalProgress} className="h-2" />
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                {goalMet ? "Goal complete—great job!" : `${goalProgress.toFixed(0)}% of today’s goal done.`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Selection */}
        <div className="mb-6">
          <h2 className="mb-4 text-center font-bold text-3xl text-white">What do you want to do today?</h2>
        </div>

  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Chat with Moe Card */}
          <Card className="group border-4 border-white/20 bg-white transition-all hover:scale-105 hover:shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
                <MessageSquare className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="font-bold text-2xl">Chat with Moe</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Ask Moe for help with your homework. He's friendly and always ready to explain things!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="h-14 w-full bg-primary font-bold text-lg hover:bg-primary/90">
                <Link href={`/student/${id}/chat`}>Start Chatting</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-4 border-white/20 bg-white transition-all hover:scale-105 hover:shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70">
                <Volume2 className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="font-bold text-2xl">Learn Words</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Type any word and Moe will pronounce it for you. Practice reading with interactive sentences!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                size="lg"
                className="h-14 w-full bg-accent font-bold text-lg text-white hover:bg-accent/90"
              >
                <Link href={`/student/${id}/learn-words`}>Learn Words</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-4 border-white/20 bg-white transition-all hover:scale-105 hover:shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500">
                <BookMarked className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="font-bold text-2xl">Word Bank</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Review every word you've practiced with Moe. See what’s mastered and what needs another look.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                size="lg"
                className="h-14 w-full bg-amber-400 font-bold text-lg text-slate-900 hover:bg-amber-300"
              >
                <Link href={`/student/${id}/word-bank`}>Open Word Bank</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-4 border-white/20 bg-white transition-all hover:scale-105 hover:shadow-2xl md:col-span-2 xl:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
                <Calculator className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="font-bold text-2xl">Solve Math Problems</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Moe will show you each step so math feels easy. Practice, check your work, and celebrate wins!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                size="lg"
                className="h-14 w-full bg-emerald-500 font-bold text-lg text-white hover:bg-emerald-600"
              >
                <Link href={`/student/${id}/math`}>Start Solving</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Reading Practice Card */}
          <Card className="group border-4 border-white/20 bg-white transition-all hover:scale-105 hover:shadow-2xl md:col-span-2 xl:col-span-3">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/70">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="font-bold text-2xl">Reading Practice</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Practice your reading skills with fun stories and improve your speed and comprehension!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 w-full bg-secondary font-bold text-lg text-white hover:bg-secondary/90"
              >
                <Link href={`/student/${id}/reading`}>Start Reading</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Encouragement Message */}
        <Card className="mt-8 border-2 border-white/20 bg-white/95 backdrop-blur-sm">
          <CardContent className="py-6 text-center">
            <p className="font-semibold text-lg text-accent">{goalMessage}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
