import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, CheckCircle2, TrendingUp, BookOpen, MessageSquare, Clock } from "lucide-react"

// Mock notifications data
const mockNotifications = [
  {
    id: "1",
    type: "achievement",
    title: "Aminata reached a 5-day streak!",
    description: "Aminata has been learning consistently for 5 days in a row. Great job!",
    time: "2 hours ago",
    read: false,
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "2",
    type: "activity",
    title: "Mohamed completed a reading session",
    description: "Mohamed finished reading 'Market Day in Freetown' and scored 100% on the quiz!",
    time: "5 hours ago",
    read: false,
    icon: BookOpen,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "3",
    type: "activity",
    title: "Aminata asked Moe for help",
    description: "Aminata had a 25-minute chat session about Mathematics homework.",
    time: "1 day ago",
    read: true,
    icon: MessageSquare,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "4",
    type: "milestone",
    title: "Mohamed completed 20 total sessions!",
    description: "Mohamed has reached an important milestone. Keep up the excellent work!",
    time: "2 days ago",
    read: true,
    icon: CheckCircle2,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "5",
    type: "reminder",
    title: "Aminata hasn't practiced today",
    description: "Encourage Aminata to continue her learning streak!",
    time: "3 days ago",
    read: true,
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-xl">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="font-semibold">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {unreadCount > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              You have <span className="font-semibold text-foreground">{unreadCount}</span> unread notification
              {unreadCount !== 1 ? "s" : ""}
            </p>
            <Button variant="ghost" size="sm" className="font-semibold text-primary">
              Mark all as read
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {mockNotifications.map((notification) => {
            const Icon = notification.icon
            return (
              <Card
                key={notification.id}
                className={`border-2 transition-all hover:shadow-md ${notification.read ? "bg-white" : "border-primary/30 bg-primary/5"}`}
              >
                <CardContent className="flex gap-4 p-4">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${notification.bgColor}`}
                  >
                    <Icon className={`h-6 w-6 ${notification.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight">{notification.title}</h3>
                      {!notification.read && <Badge className="flex-shrink-0 bg-primary text-xs">New</Badge>}
                    </div>
                    <p className="mb-2 text-muted-foreground text-sm leading-relaxed">{notification.description}</p>
                    <p className="text-muted-foreground text-xs">{notification.time}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {mockNotifications.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 font-bold text-xl">No Notifications Yet</h3>
              <p className="text-muted-foreground">
                You'll see updates about your children's learning activities here.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
