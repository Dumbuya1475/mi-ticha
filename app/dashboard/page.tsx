"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Bell, LogOut, BookOpen, MessageSquare, Clock, TrendingUp } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Child {
  id: string
  name: string
  age: number
  grade: string
  totalSessions: number
  hoursLearned: number
  lastActive: string
  weeklyProgress: number
  wordsLearned: number
  recentWords: string[]
}

interface Stats {
  totalChildren: number
  totalHours: number
  totalSessions: number
  averageProgress: number
  totalWordsLearned: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [stats, setStats] = useState<Stats>({
    totalChildren: 0,
    totalHours: 0,
    totalSessions: 0,
    averageProgress: 0,
    totalWordsLearned: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [parentId, setParentId] = useState<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string>("")
  const [switchStatus, setSwitchStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createBrowserClient()

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/login")
          return
        }

        setParentId(user.id)

        // Fetch children/students for this parent
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .eq("parent_id", user.id)

        if (studentsError) {
          console.error("[v0] Error fetching students:", studentsError)
          setIsLoading(false)
          return
        }

        // Calculate stats for each child
        const childrenWithStats = await Promise.all(
          (studentsData || []).map(async (student) => {
            // Get total sessions
            const { count: sessionsCount } = await supabase
              .from("study_sessions")
              .select("*", { count: "exact", head: true })
              .eq("student_id", student.id)

            // Get total hours from study sessions
            const { data: sessionsData } = await supabase
              .from("study_sessions")
              .select("duration_minutes")
              .eq("student_id", student.id)

            const totalMinutes = sessionsData?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0
            const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10

            // Get vocabulary progress
            const { count: wordsCount } = await supabase
              .from("words_learned")
              .select("id", { count: "exact", head: true })
              .eq("student_id", student.id)
              .eq("mastered", true)

            const { data: latestWordsData } = await supabase
              .from("words_learned")
              .select("word, last_reviewed_at")
              .eq("student_id", student.id)
              .eq("mastered", true)
              .order("last_reviewed_at", { ascending: false })
              .limit(3)

            const recentWords = (latestWordsData ?? [])
              .map((entry) => entry.word)
              .filter((word): word is string => Boolean(word))

            // Get last activity
            const { data: lastSession } = await supabase
              .from("study_sessions")
              .select("created_at")
              .eq("student_id", student.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            const lastActive = lastSession ? formatLastActive(new Date(lastSession.created_at)) : "No activity yet"

            // Calculate weekly progress (sessions in last 7 days vs target)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)

            const { count: weeklySessionsCount } = await supabase
              .from("study_sessions")
              .select("*", { count: "exact", head: true })
              .eq("student_id", student.id)
              .gte("created_at", weekAgo.toISOString())

            const weeklyProgress = Math.min(Math.round(((weeklySessionsCount || 0) / 7) * 100), 100)

            return {
              id: student.id,
              name: student.name,
              age: student.age,
              grade: student.grade,
              totalSessions: sessionsCount || 0,
              hoursLearned,
              lastActive,
              weeklyProgress,
              wordsLearned: wordsCount || 0,
              recentWords,
            }
          }),
        )

        setChildren(childrenWithStats)

        // Calculate overall stats
        const totalSessions = childrenWithStats.reduce((sum, child) => sum + child.totalSessions, 0)
        const totalHours = childrenWithStats.reduce((sum, child) => sum + child.hoursLearned, 0)
        const totalWordsLearned = childrenWithStats.reduce((sum, child) => sum + child.wordsLearned, 0)
        const averageProgress =
          childrenWithStats.length > 0
            ? Math.round(
                childrenWithStats.reduce((sum, child) => sum + child.weeklyProgress, 0) / childrenWithStats.length,
              )
            : 0

        setStats({
          totalChildren: childrenWithStats.length,
          totalHours: Math.round(totalHours * 10) / 10,
          totalSessions,
          averageProgress,
          totalWordsLearned,
        })

        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error in fetchData:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children, selectedChildId])

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

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleSwitchAccount = () => {
    if (!selectedChildId) {
      setSwitchStatus({ type: "error", message: "Pick a student to switch into." })
      return
    }

    const target = children.find((child) => child.id === selectedChildId)

    if (!target) {
      setSwitchStatus({ type: "error", message: "That student is no longer available." })
      return
    }

    try {
      if (typeof window === "undefined") {
        throw new Error("Switching requires a browser environment")
      }
      localStorage.setItem("studentId", target.id)
      localStorage.setItem("studentName", target.name)
      setSwitchStatus({ type: "success", message: `Switched to ${target.name}'s view.` })
      router.push(`/student/${target.id}`)
    } catch (error) {
      console.error("[v0] Failed to switch account:", error)
      setSwitchStatus({ type: "error", message: "Couldn't switch accounts right now." })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-bold text-2xl">Mi Ticha</h1>
            <p className="text-muted-foreground text-sm">Parent Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="mb-2 font-bold text-3xl">Welcome Back!</h2>
          <p className="text-muted-foreground text-lg">Here's how your children are doing this week.</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Children</p>
                  <p className="font-bold text-3xl">{stats.totalChildren}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Hours</p>
                  <p className="font-bold text-3xl">{stats.totalHours}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Sessions</p>
                  <p className="font-bold text-3xl">{stats.totalSessions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg Progress</p>
                  <p className="font-bold text-3xl">{stats.averageProgress}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Words Mastered</p>
                  <p className="font-bold text-3xl">{stats.totalWordsLearned}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {children.length > 0 ? (
          <Card className="mb-8 border-2 border-primary/20 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Jump to Student View</CardTitle>
              <CardDescription>
                Switch into a child account without logging out. We&apos;ll remember your selection on this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Select value={selectedChildId} onValueChange={(value) => setSelectedChildId(value)}>
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSwitchAccount} className="sm:w-auto">
                  Switch to student dashboard
                </Button>
              </div>
              {switchStatus ? (
                <p className={`text-sm ${switchStatus.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                  {switchStatus.message}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* Children List */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-2xl">Your Children</h3>
          <div className="flex items-center gap-2">
            {children.length >= 2 && (
              <Button asChild variant="outline" className="font-semibold">
                <Link href="/dashboard/compare">Compare Children</Link>
              </Button>
            )}
            <Button asChild className="font-semibold">
              <Link href="/add-child">
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </Link>
            </Button>
          </div>
        </div>

        {children.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {children.map((child) => (
              <Card key={child.id} className="border-2 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 border-2 border-primary">
                        <AvatarFallback className="bg-primary/10 font-bold text-lg text-primary">
                          {child.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{child.name}</CardTitle>
                        <CardDescription className="text-base">
                          {child.age} years • {child.grade}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {child.weeklyProgress}% this week
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="font-bold text-2xl text-primary">{child.totalSessions}</p>
                      <p className="text-muted-foreground text-xs">Sessions</p>
                    </div>
                    <div>
                      <p className="font-bold text-2xl text-secondary">{child.hoursLearned}h</p>
                      <p className="text-muted-foreground text-xs">Hours</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Last Active</p>
                      <p className="font-semibold text-sm">{child.lastActive}</p>
                    </div>
                  </div>
                  <div className="mb-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-primary">Words mastered</p>
                      <span className="font-bold text-lg text-primary">{child.wordsLearned}</span>
                    </div>
                    {child.wordsLearned > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {child.recentWords.map((word) => (
                          <Badge key={word} variant="outline" className="border-primary/40 text-primary">
                            {word}
                          </Badge>
                        ))}
                        {child.wordsLearned > child.recentWords.length ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            +{child.wordsLearned - child.recentWords.length} more
                          </Badge>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-muted-foreground text-sm">No mastered words yet.</p>
                    )}
                  </div>
                  <Button asChild variant="outline" className="w-full bg-transparent font-semibold">
                    <Link href={`/dashboard/child/${child.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 font-bold text-xl">No Children Added Yet</h3>
              <p className="mb-6 text-muted-foreground">
                Add your first child to start tracking their learning progress.
              </p>
              <Button asChild size="lg" className="font-semibold">
                <Link href="/add-child">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Child
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
