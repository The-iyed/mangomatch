"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { full_name: string; email: string }) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "User not authenticated" }
    }

    // Update the profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return { error: profileError.message }
    }

    // Update email if changed
    if (data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: data.email,
      })

      if (emailError) {
        return { error: emailError.message }
      }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { error: "Failed to update profile" }
  }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "User not authenticated" }
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: data.currentPassword,
    })

    if (signInError) {
      return { error: "Current password is incorrect" }
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating password:", error)
    return { error: "Failed to update password" }
  }
}

export async function uploadAvatar(file: File) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "User not authenticated" }
    }

    // Upload the file
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      return { error: uploadError.message }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("profiles").getPublicUrl(filePath)

    // Update the profile with the new avatar URL
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath("/profile")
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return { error: "Failed to upload avatar" }
  }
}
