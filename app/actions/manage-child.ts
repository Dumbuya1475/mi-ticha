"use server"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createChildAccount(formData: {
  name: string
  age: number
  grade: string
  password: string
}) {
  try {
    const supabase = await getSupabaseServerClient()
    const adminClient = getSupabaseAdminClient()

    // Get current user (parent)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated" }
    }

    // Get parent profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile error:", profileError)
      return { error: "Parent profile not found" }
    }

    // Create unique email for child using parent's user ID
    const childEmail = `${user.id}+${formData.name.toLowerCase().replace(/\s+/g, "")}@miticha.internal`

    // Create auth account for child using admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: childEmail,
      password: formData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: formData.name,
        is_student: true,
        managed_by: user.id,
      },
    })

    if (authError || !authData.user) {
      console.error("[v0] Auth creation error:", authError)
      return { error: authError?.message || "Failed to create child account" }
    }

    // Create student record
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        name: formData.name,
        age: formData.age,
        grade_level: formData.grade,
        parent_id: profile.id,
        auth_user_id: authData.user.id,
        is_managed: true,
      })
      .select()
      .single()

    if (studentError) {
      console.error("[v0] Student creation error:", studentError)
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: "Failed to create student profile" }
    }

    revalidatePath("/dashboard")
    return { success: true, student }
  } catch (error) {
    console.error("[v0] Create child error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function resetChildPassword(studentId: string, newPassword: string) {
  try {
    const supabase = await getSupabaseServerClient()
    const adminClient = getSupabaseAdminClient()

    // Get current user (parent)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated" }
    }

    // Get parent profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "Parent profile not found" }
    }

    // Verify student belongs to parent
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("auth_user_id")
      .eq("id", studentId)
      .eq("parent_id", profile.id)
      .single()

    if (studentError || !student) {
      return { error: "Student not found or unauthorized" }
    }

    // Update password using admin client
    const { error: updateError } = await adminClient.auth.admin.updateUserById(student.auth_user_id, {
      password: newPassword,
    })

    if (updateError) {
      console.error("[v0] Password reset error:", updateError)
      return { error: "Failed to reset password" }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteChildAccount(studentId: string) {
  try {
    const supabase = await getSupabaseServerClient()
    const adminClient = getSupabaseAdminClient()

    // Get current user (parent)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated" }
    }

    // Get parent profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "Parent profile not found" }
    }

    // Get student and verify ownership
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("auth_user_id")
      .eq("id", studentId)
      .eq("parent_id", profile.id)
      .single()

    if (studentError || !student) {
      return { error: "Student not found or unauthorized" }
    }

    // Delete auth user (cascade will delete student record)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(student.auth_user_id)

    if (deleteError) {
      console.error("[v0] Delete user error:", deleteError)
      return { error: "Failed to delete account" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete child error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateChildProfile(
  studentId: string,
  updates: {
    name?: string
    age?: number
    grade?: string
  },
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current user (parent)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated" }
    }

    // Get parent profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "Parent profile not found" }
    }

    const dbUpdates: any = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.age) dbUpdates.age = updates.age
    if (updates.grade) dbUpdates.grade_level = updates.grade

    // Update student (RLS will verify ownership)
    const { error: updateError } = await supabase
      .from("students")
      .update(dbUpdates)
      .eq("id", studentId)
      .eq("parent_id", profile.id)

    if (updateError) {
      console.error("[v0] Update student error:", updateError)
      return { error: "Failed to update student profile" }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/child/${studentId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Update child error:", error)
    return { error: "An unexpected error occurred" }
  }
}
