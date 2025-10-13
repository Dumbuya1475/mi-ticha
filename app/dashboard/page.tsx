import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, LogOut, BookOpen, MessageSquare, Clock, TrendingUp } from "lucide-react"

// Mock data - will be replaced with Supabase data
const mockChildren = [
  {
    id: "1",
    name: "Aminata Kamara",
    age: 10,
    grade: "Primary 5",
    totalSessions: 24,
    hoursLearned: 12.5,
    lastActive: "2 hours ago",
    weeklyProgress: 85,
  },
  {
    id: "2",
    name: "Mohamed Sesay",
    age: 12,
    grade: "JSS 1",
    totalSessions: 18,
    hoursLearned: 9.2,
    lastActive: "1 day ago",
    weeklyProgress: 72,
  },
]

const mockStats = {
  totalChildren: 2,
  totalHours: 21.7,
  totalSessions: 42,
  averageProgress: 78,
}

export default function DashboardPage() {
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
            <Button variant="ghost" size="icon">
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
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Children</p>
                  <p className="font-bold text-3xl">{mockStats.totalChildren}</p>
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
                  <p className="font-bold text-3xl">{mockStats.totalHours}</p>
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
                  <p className="font-bold text-3xl">{mockStats.totalSessions}</p>
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
                  <p className="font-bold text-3xl">{mockStats.averageProgress}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children List */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-2xl">Your Children</h3>
          <Button asChild className="font-semibold">
            <Link href="/add-child">
              <Plus className="mr-2 h-4 w-4" />
              Add Child
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {mockChildren.map((child) => (
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
                <Button asChild variant="outline" className="w-full font-semibold bg-transparent">
                  <Link href={`/dashboard/child/${child.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockChildren.length === 0 && (
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
