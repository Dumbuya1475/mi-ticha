"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, EyeOff, GraduationCap } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Student {
  id: string
  name: string
  age: number
  grade_level: string
  pin_hash: string
}

export default function StudentLoginPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("students").select("id, name, age, grade_level, pin_hash")

      if (error) {
        console.error("[v0] Error loading students:", error)
        setError("Failed to load students")
        return
      }

      console.log("[v0] Loaded students:", data)
      setStudents(data || [])
    } catch (error) {
      console.error("[v0] Error:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedStudentId) {
      setError("Please select your name")
      return
    }

    if (!pin) {
      setError("Please enter your PIN")
      return
    }

    if (pin.length < 4 || pin.length > 6) {
      setError("PIN must be 4-6 digits")
      return
    }

    setIsLoading(true)

    try {
      const student = students.find((s) => s.id === selectedStudentId)
      if (!student) {
        setError("Student not found")
        setIsLoading(false)
        return
      }

      // Verify PIN
      const bcrypt = await import("bcryptjs")
      const isValid = await bcrypt.compare(pin, student.pin_hash)

      if (!isValid) {
        setError("Incorrect PIN. Please try again.")
        setPin("")
        setIsLoading(false)
        return
      }

      console.log("[v0] Login successful for student:", student.name)

      // Store student session in localStorage
      localStorage.setItem("studentId", student.id)
      localStorage.setItem("studentName", student.name)

      // Redirect to student home
      router.push(`/student/${student.id}`)
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent px-4 py-8">
      <div className="mx-auto max-w-md">
        <Button variant="ghost" asChild className="mb-6 text-white hover:bg-white/20">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <Card className="border-4 border-white/20 bg-white">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="font-bold text-3xl">Student Login</CardTitle>
            <CardDescription className="text-base">
              Select your name and enter your PIN to start learning!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="space-y-4 py-8 text-center">
                <p className="text-muted-foreground">No students found.</p>
                <p className="text-muted-foreground text-sm">Ask your parent to add you first!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-center text-destructive text-sm">{error}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="student" className="font-semibold text-base">
                    What's your name?
                  </Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger id="student" className="h-14 text-base">
                      <SelectValue placeholder="Select your name" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id} className="text-base">
                          {student.name} ({student.age} years old)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin" className="font-semibold text-base">
                    Enter your PIN
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      placeholder="Enter your 4-6 digit PIN"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value)
                        setError("")
                      }}
                      className="h-14 pr-12 text-center font-bold text-2xl tracking-widest"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 -translate-y-1/2"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-14 w-full bg-primary font-bold text-lg hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Start Learning!"}
                </Button>

                <p className="text-center text-muted-foreground text-sm">
                  Forgot your PIN? Ask your parent to help you.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
