"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, GraduationCap } from "lucide-react"
import { studentLogin } from "@/app/actions/student-auth"

export default function StudentLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username) {
      setError("Please enter your username")
      return
    }

    if (!password) {
      setError("Please enter your password")
      return
    }

    setIsLoading(true)

    try {
      const result = await studentLogin(username, password)

      if (result.error) {
        setError(result.error)
        setPassword("")
        setIsLoading(false)
        return
      }

      if (result.success && result.studentId) {
        console.log("[v0] Redirecting to student dashboard:", result.studentId)
        router.push(`/student/${result.studentId}`)
      }
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
            <CardDescription className="text-base">Enter your name and password to start learning!</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-center text-destructive text-sm">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="font-semibold text-base">
                  Your Name
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError("")
                  }}
                  className="h-14 text-base"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-base">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError("")
                    }}
                    className="h-14 pr-12 text-base"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                Forgot your password? Ask your parent to help you.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
