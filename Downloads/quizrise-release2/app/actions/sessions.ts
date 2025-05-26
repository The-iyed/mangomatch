"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Helper function to generate a random code
export async function generateRandomCode(length: number): Promise<string> {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar looking characters
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Format date for display
export async function formatDate(date: string | number | Date): Promise<string> {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format date and time for display
export async function formatDateTime(date: string | number | Date): Promise<string> {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  })
}

// Type for session creation result
type SessionCreationResult = {
  success: boolean
  sessionId?: string
  error?: string
}

// Get all quiz sessions
export async function getQuizSessions() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const { data: sessions, error } = await supabase
      .from("quiz_sessions")
      .select(`
        *,
        quiz:quiz_id(id, title),
        participant_count:session_participants(count)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the sessions data
    return sessions.map((session) => ({
      ...session,
      participant_count: session.participant_count?.[0]?.count || 0,
    }))
  } catch (error) {
    console.error("Error fetching quiz sessions:", error)
    return []
  }
}

// Get a single quiz session by ID
export async function getQuizSessionById(sessionId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const { data: session, error } = await supabase
      .from("quiz_sessions")
      .select(`
        *,
        quiz:quiz_id(id, title, description, category_id, difficulty, questions(count)),
        admin:admin_id(id, full_name, email),
        participant_count:session_participants(count)
      `)
      .eq("id", sessionId)
      .single()

    if (error) throw error

    // Format the session data
    return {
      ...session,
      participant_count: session.participant_count?.[0]?.count || 0,
      question_count: session.quiz?.questions?.[0]?.count || 0,
    }
  } catch (error) {
    console.error(`Error fetching quiz session ${sessionId}:`, error)
    return null
  }
}

// Create a new quiz session
export async function createQuizSession(formData: FormData): Promise<SessionCreationResult> {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || !session.user) {
      return { success: false, error: "User not authenticated" }
    }

    const userId = session.user.id

    // Extract form data
    const quizId = formData.get("quizId") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const durationMinutes = Number.parseInt(formData.get("durationMinutes") as string, 10)

    // Validate inputs
    if (!quizId || !title || isNaN(durationMinutes)) {
      return { success: false, error: "Missing required fields" }
    }

    // Generate a unique access code
    const accessCode = await generateRandomCode(6)

    // Create the session
    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert({
        quiz_id: quizId,
        admin_id: userId,
        title,
        description,
        duration_minutes: durationMinutes,
        access_code: accessCode,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/sessions")
    return { success: true, sessionId: data.id }
  } catch (error: any) {
    console.error("Error creating quiz session:", error)
    return { success: false, error: error.message || "Failed to create session" }
  }
}

// Start a quiz session
export async function startQuizSession(sessionId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const now = new Date()

    const { data: session, error } = await supabase
      .from("quiz_sessions")
      .update({
        status: "active",
        start_time: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/admin/sessions/${sessionId}`)
    return { success: true }
  } catch (error) {
    console.error(`Error starting quiz session ${sessionId}:`, error)
    return { success: false, error: "Failed to start session" }
  }
}

// End a quiz session
export async function endQuizSession(sessionId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const now = new Date()

    const { data: session, error } = await supabase
      .from("quiz_sessions")
      .update({
        status: "completed",
        end_time: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/admin/sessions/${sessionId}`)
    return { success: true }
  } catch (error) {
    console.error(`Error ending quiz session ${sessionId}:`, error)
    return { success: false, error: "Failed to end session" }
  }
}

// Get session participants
export async function getSessionParticipants(sessionId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const { data: participants, error } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("score", { ascending: false })

    if (error) throw error

    return participants
  } catch (error) {
    console.error(`Error fetching participants for session ${sessionId}:`, error)
    return []
  }
}

// Join a session with an access code
export async function joinSessionWithCode(accessCode: string, participantName: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Find the session with this access code
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("access_code", accessCode)
      .eq("status", "active")
      .single()

    if (sessionError) {
      return { success: false, error: "Invalid or expired access code" }
    }

    // Get the current user if logged in
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession()

    // Create a participant record
    const { data: participant, error: participantError } = await supabase
      .from("session_participants")
      .insert({
        session_id: session.id,
        user_id: authSession?.user?.id || null,
        display_name: participantName,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (participantError) {
      // Check if the user has already joined
      if (participantError.message.includes("unique constraint")) {
        return { success: false, error: "You have already joined this session" }
      }
      throw participantError
    }

    return {
      success: true,
      sessionId: session.id,
      participantId: participant.id,
    }
  } catch (error) {
    console.error("Error joining session:", error)
    return { success: false, error: "Failed to join session" }
  }
}
