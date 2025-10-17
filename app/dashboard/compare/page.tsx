"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export default function CompareChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchChildren() {
      try {
        const supabase = createBrowserClient()
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) {
          setIsLoading(false)
          return
        }
        // Fetch children/students for this parent
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .eq("parent_id", user.id)
        if (studentsError) {
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
          })
        )
        setChildren(childrenWithStats)
      } catch (error) {
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }
    fetchChildren()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Compare Children</h1>
        <Card className="mb-8 p-6 border-2 border-orange-300 bg-white shadow-lg">
          <p className="text-lg text-gray-700 mb-2">See a side-by-side comparison of your children's learning progress, strengths, and areas to improve.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </Card>
        {isLoading ? (
          <div className="text-center text-gray-400 mt-12">Loading...</div>
        ) : children.length < 2 ? (
          <div className="text-center text-gray-400 mt-12">Add at least two children to compare.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow">
              <thead className="bg-orange-100">
                <tr>
                  <th className="p-3 text-left font-bold">Name</th>
                  <th className="p-3 text-left font-bold">Age</th>
                  <th className="p-3 text-left font-bold">Grade</th>
                  <th className="p-3 text-left font-bold">Sessions</th>
                  <th className="p-3 text-left font-bold">Hours</th>
                  <th className="p-3 text-left font-bold">Words Mastered</th>
                  <th className="p-3 text-left font-bold">Recent Words</th>
                  <th className="p-3 text-left font-bold">Weekly Progress</th>
                  <th className="p-3 text-left font-bold">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <tr key={child.id} className="bg-white even:bg-orange-50">
                    <td className="p-3 font-semibold text-blue-700">{child.name}</td>
                    <td className="p-3">{child.age}</td>
                    <td className="p-3">{child.grade}</td>
                    <td className="p-3">{child.totalSessions}</td>
                    <td className="p-3">{child.hoursLearned}</td>
                    <td className="p-3">{child.wordsLearned}</td>
                    <td className="p-3">
                      {child.recentWords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {child.recentWords.map((word) => (
                            <Badge key={word} variant="outline" className="border-primary/40 text-primary text-xs px-2 py-1">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="p-3">{child.weeklyProgress}%</td>
                    <td className="p-3">{child.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Placeholder for AI summary */}
        <Card className="mt-8 p-6 border-2 border-blue-300 bg-white shadow-lg">
          <h2 className="text-xl font-bold mb-2 text-blue-700">AI Summary</h2>
          <p className="text-gray-700">Coming soon: Moe will analyze your children's strengths, weaknesses, and suggest ways to improve.</p>
        </Card>
      </div>
    </div>
  )
}
