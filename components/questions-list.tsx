"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Calculator, Volume2, HelpCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Question = {
  id: string
  question_text: string
  question_type: string
  created_at: string
  answers: {
    answer_text: string
  }[]
}

export function QuestionsList({ studentId }: { studentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase
          .from("questions")
          .select(`
            id,
            question_text,
            question_type,
            created_at,
            answers (
              answer_text
            )
          `)
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error

        setQuestions(data || [])
      } catch (error) {
        console.error("[v0] Error fetching questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [studentId])

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "math":
        return <Calculator className="h-5 w-5 text-primary" />
      case "word":
        return <Volume2 className="h-5 w-5 text-secondary" />
      default:
        return <MessageSquare className="h-5 w-5 text-accent" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "math":
        return "Math"
      case "word":
        return "Word"
      case "science":
        return "Science"
      default:
        return "Other"
    }
  }

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading questions...</p>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <HelpCircle className="mb-4 h-16 w-16 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            No questions yet. Your child's questions will appear here once they start learning with Moe.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardContent className="space-y-4 pt-6">
        {questions.map((question) => (
          <div key={question.id} className="rounded-lg border-2 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  {getQuestionIcon(question.question_type)}
                </div>
                <div className="flex-1">
                  <p className="mb-1 font-semibold text-base leading-relaxed">{question.question_text}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(question.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {getQuestionTypeLabel(question.question_type)}
              </Badge>
            </div>
            {question.answers && question.answers.length > 0 && (
              <div className="ml-13 rounded-md bg-accent/5 p-3">
                <p className="mb-1 font-semibold text-accent text-sm">Moe's Answer:</p>
                <p className="text-sm leading-relaxed">{question.answers[0].answer_text}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
