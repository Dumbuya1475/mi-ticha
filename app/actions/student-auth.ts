"use server"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function studentLogin(username: string, password: string) {
  try {
    const adminClient = getSupabaseAdminClient()

    // Search for student by name
    const { data: students, error: searchError } = await adminClient
      .from("students")
      .select("id, name, auth_user_id")
      .ilike("name", username)
      .limit(5)

    if (searchError) {
      console.error("[v0] Search error:", searchError)
      return { error: "Failed to find student" }
    }

    if (!students || students.length === 0) {
      return { error: "Student not found. Please check your username." }
    }

    // If multiple matches, try exact match first
    let student = students.find((s) => s.name.toLowerCase() === username.toLowerCase())
    if (!student) {
      student = students[0] // Use first match
    }

    // Get the auth user email using admin client
    const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(student.auth_user_id)

    if (authError || !authUserData.user) {
      console.error("[v0] Auth user error:", authError)
      return { error: "Login system error. Please contact your parent." }
    }

    // Create a regular Supabase client with cookies for session management
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    )

    // Sign in with email and password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authUserData.user.email!,
      password: password,
    })

    if (signInError) {
      console.error("[v0] Sign in error:", signInError)
      return { error: "Incorrect password. Please try again." }
    }

    console.log("[v0] Login successful for student:", student.name)

    return {
      success: true,
      studentId: student.id,
      studentName: student.name,
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { error: "An unexpected error occurred" }
  }
}
