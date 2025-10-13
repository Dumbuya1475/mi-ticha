"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  recentActivities: Activity[]
  subjectProgress: SubjectProgress[]
}

interface Activity {
  id: string
  type: "chat" | "reading"
  title: string
  duration: string
  date: string
  subject: string
}

interface SubjectProgress {
  subject: string
  progress: number
  sessions: number
}

export default function ChildDetailPage({ params }: { params: { id: string } }) {
  const [child, setChild] = useState<ChildData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchChildData() {
      try {
        const supabase = createBrowserClient()

        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("id", params.id)
          .single()

        if (studentError || !studentData) {
          console.error("[v0] Error fetching student:", studentError)
          setIsLoading(false)
          return
        }

        // Get total sessions
        const { count: sessionsCount } = await supabase
          .from("study_sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", params.id)

        // Get total hours
        const { data: sessionsData } = await supabase
          .from("study_sessions")
          .select("duration_minutes")
          .eq("student_id", params.id)

        const totalMinutes = sessionsData?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0
        const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10

        // Get last activity
        const { data: lastSession } = await supabase
          .from("study_sessions")
          .select("created_at")
          .eq("student_id", params.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const lastActive = lastSession ? formatLastActive(new Date(lastSession.created_at)) : "No activity yet"

        // Calculate weekly progress
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const { count: weeklySessionsCount } = await supabase
          .from("study_sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", params.id)
          .gte("created_at", weekAgo.toISOString())

        const weeklyProgress = Math.min(Math.round(((weeklySessionsCount || 0) / 7) * 100), 100)

        // Fetch recent activities (questions and reading activities)
        const { data: questionsData } = await supabase
          .from("questions")
          .select("*")
          .eq("student_id", params.id)
          .order("created_at", { ascending: false })
          .limit(2)

        const { data: readingData } = await supabase
          .from("reading_activities")
          .select("*")
          .eq("student_id", params.id)
          .order("created_at", { ascending: false })
          .limit(2)

        const recentActivities: Activity[] = [
          ...(questionsData || []).map((q) => ({
            id: q.id,
            type: "chat" as const,
            title: q.question_text.substring(0, 50) + "...",
            duration: "N/A",
            date: formatDate(new Date(q.created_at)),
            subject: q.subject || "General",
          })),
          ...(readingData || []).map((r) => ({
            id: r.id,
            type: "reading" as const,
            title: "Reading Practice",
            duration: `${r.duration_minutes || 0} min`,
            date: formatDate(new Date(r.created_at)),
            subject: "English",
          })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4)

        // Calculate subject progress
        const { data: subjectStats } = await supabase
          .from("daily_stats")
          .select("subject, questions_answered")
          .eq("student_id", params.id)

        const subjectMap = new Map<string, { total: number; count: number }>()
        subjectStats?.forEach((stat) => {
          const subject = stat.subject || "General"
          const current = subjectMap.get(subject) || { total: 0, count: 0 }
          subjectMap.set(subject, {
            total: current.total + (stat.questions_answered || 0),
            count: current.count + 1,
          })
        })

        const subjectProgress: SubjectProgress[] = Array.from(subjectMap.entries()).map(([subject, data]) => ({
          subject,
          progress: Math.min(Math.round((data.total / (data.count * 10)) * 100), 100),
          sessions: data.count,
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
          recentActivities,
          subjectProgress:
            subjectProgress.length > 0
              ? subjectProgress
              : [
                  { subject: "Mathematics", progress: 0, sessions: 0 },
                  { subject: "English", progress: 0, sessions: 0 },
                  { subject: "Science", progress: 0, sessions: 0 },
                ],
        })

        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching child data:", error)
        setIsLoading(false)
      }
    }

    fetchChildData()
  }, [params.id])

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
                        <p className="text-muted-foreground text-sm">{subject.sessions} sessions</p>
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
                  child.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                          activity.type === "chat" ? "bg-primary/10" : "bg-secondary/10"
                        }`}
                      >
                        {activity.type === "chat" ? (
                          <MessageSquare className="h-6 w-6 text-primary" />
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
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 font-bold text-2xl">Questions Asked</h2>
          <QuestionsList studentId={params.id} />
        </div>
      </main>
    </div>
  )
}
