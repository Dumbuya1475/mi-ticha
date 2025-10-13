"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, CheckCircle2, TrendingUp, BookOpen, MessageSquare, Clock } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  type: string
  title: string
  description: string
  time: string
  read: boolean
  icon: any
  color: string
  bgColor: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
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

        // Fetch notifications for this parent
        const { data: notificationsData, error: notificationsError } = await supabase
          .from("parent_notifications")
          .select("*")
          .eq("parent_id", user.id)
          .order("created_at", { ascending: false })

        if (notificationsError) {
          console.error("[v0] Error fetching notifications:", notificationsError)
          setIsLoading(false)
          return
        }

        // Map notifications to UI format
        const formattedNotifications: Notification[] = (notificationsData || []).map((notif) => {
          const iconMap: Record<string, any> = {
            achievement: TrendingUp,
            activity: BookOpen,
            milestone: CheckCircle2,
            reminder: Clock,
            message: MessageSquare,
          }

          const colorMap: Record<string, { color: string; bgColor: string }> = {
            achievement: { color: "text-accent", bgColor: "bg-accent/10" },
            activity: { color: "text-secondary", bgColor: "bg-secondary/10" },
            milestone: { color: "text-accent", bgColor: "bg-accent/10" },
            reminder: { color: "text-primary", bgColor: "bg-primary/10" },
            message: { color: "text-primary", bgColor: "bg-primary/10" },
          }

          const style = colorMap[notif.type] || { color: "text-primary", bgColor: "bg-primary/10" }

          return {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            description: notif.message,
            time: formatTime(new Date(notif.created_at)),
            read: notif.read,
            icon: iconMap[notif.type] || Bell,
            ...style,
          }
        })

        setNotifications(formattedNotifications)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error in fetchNotifications:", error)
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [router])

  function formatTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  async function handleMarkAllAsRead() {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from("parent_notifications").update({ read: true }).eq("parent_id", user.id).eq("read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

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
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {unreadCount > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              You have <span className="font-semibold text-foreground">{unreadCount}</span> unread notification
              {unreadCount !== 1 ? "s" : ""}
            </p>
            <Button variant="ghost" size="sm" className="font-semibold text-primary" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
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
            })
          ) : (
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
        </div>
      </main>
    </div>
  )
}
