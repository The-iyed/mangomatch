"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function fetchAllUsers() {
  try {
    const supabase = createServerSupabaseClient()

    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) throw profilesError

    // Get auth users to get email_confirmed_at
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) throw authError

    // Merge the data
    const mergedUsers = profiles.map((profile) => {
      const authUser = authUsers.users.find((au) => au.id === profile.id)
      return {
        ...profile,
        email_confirmed_at: authUser?.email_confirmed_at || null,
        last_sign_in_at: authUser?.last_sign_in_at || null,
      }
    })

    return { data: mergedUsers, error: null }
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return { data: null, error: error.message }
  }
}

export async function createUserAction(email: string, password: string, fullName: string, role: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-verify the email
      user_metadata: { full_name: fullName },
    })

    if (authError) throw authError

    // Create profile in the profiles table
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      revalidatePath("/admin/users")
      return { data: authData.user, error: null }
    }

    return { data: null, error: "Failed to create user" }
  } catch (error: any) {
    console.error("Error creating user:", error)
    return { data: null, error: error.message }
  }
}

export async function updateUserAction(userId: string, fullName: string, role: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Update profile in the profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) throw profileError

    revalidatePath("/admin/users")
    return { data: true, error: null }
  } catch (error: any) {
    console.error("Error updating user:", error)
    return { data: null, error: error.message }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete user with Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) throw authError

    revalidatePath("/admin/users")
    return { data: true, error: null }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { data: null, error: error.message }
  }
}

export async function verifyUserAction(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the user's email_confirmed_at
    const { error } = await supabase.auth.admin.updateUserById(userId, { email_confirmed: true })

    if (error) throw error

    revalidatePath("/admin/users")
    return { data: true, error: null }
  } catch (error: any) {
    console.error("Error verifying user:", error)
    return { data: null, error: error.message }
  }
}

export async function resetPasswordAction(userId: string, newPassword: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Reset the user's password
    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword })

    if (error) throw error

    revalidatePath("/admin/users")
    return { data: true, error: null }
  } catch (error: any) {
    console.error("Error resetting password:", error)
    return { data: null, error: error.message }
  }
}

export async function generateRandomPassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}
