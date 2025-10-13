"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function AddChildPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    pin: "",
    confirmPin: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Child's name is required"
    }

    if (!formData.age) {
      newErrors.age = "Please select an age"
    }

    if (!formData.grade) {
      newErrors.grade = "Please select a grade"
    }

    if (!formData.pin) {
      newErrors.pin = "Please set a PIN for your child"
    } else if (formData.pin.length < 4 || formData.pin.length > 6) {
      newErrors.pin = "PIN must be 4-6 digits"
    } else if (!/^\d+$/.test(formData.pin)) {
      newErrors.pin = "PIN must contain only numbers"
    }

    if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = "PINs do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setErrors({ form: "You must be logged in to add a child" })
        setIsLoading(false)
        return
      }

      const bcrypt = await import("bcryptjs")
      const pinHash = await bcrypt.hash(formData.pin, 10)

      const { data, error } = await supabase
        .from("students")
        .insert({
          parent_id: user.id,
          name: formData.name,
          age: Number.parseInt(formData.age),
          grade_level: formData.grade,
          pin_hash: pinHash,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding child:", error)
        setErrors({ form: "Failed to add child. Please try again." })
        setIsLoading(false)
        return
      }

      console.log("[v0] Child added successfully:", data)
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error:", error)
      setErrors({ form: "An unexpected error occurred" })
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 px-4 py-8">
      <div className="mx-auto max-w-md">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card className="border-2">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="font-bold text-3xl">Add Your Child</CardTitle>
            <CardDescription className="text-base">
              Create a profile for your child to start their learning journey with Mi Ticha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.form && (
                <div className="rounded-lg bg-destructive/10 p-3 text-center text-destructive text-sm">
                  {errors.form}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-base">
                  Child's Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your child's name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="h-12 text-base"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-destructive text-sm">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="font-semibold text-base">
                  Age
                </Label>
                <Select value={formData.age} onValueChange={(value) => handleChange("age", value)}>
                  <SelectTrigger id="age" className="h-12 text-base" aria-invalid={!!errors.age}>
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 9, 10, 11, 12, 13, 14].map((age) => (
                      <SelectItem key={age} value={age.toString()} className="text-base">
                        {age} years old
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.age && (
                  <p id="age-error" className="text-destructive text-sm">
                    {errors.age}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade" className="font-semibold text-base">
                  Grade Level
                </Label>
                <Select value={formData.grade} onValueChange={(value) => handleChange("grade", value)}>
                  <SelectTrigger id="grade" className="h-12 text-base" aria-invalid={!!errors.grade}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Primary 3", "Primary 4", "Primary 5", "Primary 6", "JSS 1", "JSS 2", "JSS 3"].map((grade) => (
                      <SelectItem key={grade} value={grade} className="text-base">
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && (
                  <p id="grade-error" className="text-destructive text-sm">
                    {errors.grade}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="font-semibold text-base">
                  Set a PIN (4-6 digits)
                </Label>
                <p className="text-muted-foreground text-sm">Your child will use this PIN to log in</p>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    placeholder="Enter 4-6 digit PIN"
                    value={formData.pin}
                    onChange={(e) => handleChange("pin", e.target.value)}
                    className="h-12 pr-10 text-base"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={!!errors.pin}
                    aria-describedby={errors.pin ? "pin-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.pin && (
                  <p id="pin-error" className="text-destructive text-sm">
                    {errors.pin}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPin" className="font-semibold text-base">
                  Confirm PIN
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? "text" : "password"}
                    placeholder="Re-enter PIN"
                    value={formData.confirmPin}
                    onChange={(e) => handleChange("confirmPin", e.target.value)}
                    className="h-12 pr-10 text-base"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={!!errors.confirmPin}
                    aria-describedby={errors.confirmPin ? "confirmPin-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPin && (
                  <p id="confirmPin-error" className="text-destructive text-sm">
                    {errors.confirmPin}
                  </p>
                )}
              </div>

              <Button type="submit" className="h-12 w-full font-semibold text-base" disabled={isLoading}>
                {isLoading ? "Adding Child..." : "Add Child"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
