import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BookOpen, MessageSquare, Clock, Calendar } from "lucide-react"
import { QuestionsList } from "@/components/questions-list"

// Mock data for individual child
const mockChildData = {
  id: "1",
  name: "Aminata Kamara",
  age: 10,
  grade: "Primary 5",
  totalSessions: 24,
  hoursLearned: 12.5,
  lastActive: "2 hours ago",
  weeklyProgress: 85,
  recentActivities: [
    {
      id: "1",
      type: "chat",
      title: "Math Homework Help",
      duration: "25 min",
      date: "Today, 2:30 PM",
      subject: "Mathematics",
    },
    {
      id: "2",
      type: "reading",
      title: "Reading Practice",
      duration: "15 min",
      date: "Today, 1:00 PM",
      subject: "English",
    },
    {
      id: "3",
      type: "chat",
      title: "Science Questions",
      duration: "30 min",
      date: "Yesterday, 4:15 PM",
      subject: "Science",
    },
    {
      id: "4",
      type: "reading",
      title: "Reading Practice",
      duration: "20 min",
      date: "Yesterday, 3:00 PM",
      subject: "English",
    },
  ],
  subjectProgress: [
    { subject: "Mathematics", progress: 78, sessions: 8 },
    { subject: "English", progress: 85, sessions: 10 },
    { subject: "Science", progress: 72, sessions: 6 },
  ],
}

export default function ChildDetailPage({ params }: { params: { id: string } }) {
  const child = mockChildData

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
                {child.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                        activity.type === "chat" ? "bg-primary/10" : "bg-secondary/10"
                      }`}
                    >
                      {activity.type === "chat" ? (
                        <MessageSquare
                          className={`h-6 w-6 ${activity.type === "chat" ? "text-primary" : "text-secondary"}`}
                        />
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
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {activity.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
