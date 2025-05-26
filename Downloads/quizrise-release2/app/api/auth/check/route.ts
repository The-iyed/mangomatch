import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  return NextResponse.json({
    authenticated: true,
    role: profile?.role,
    redirectTo: profile?.role === "admin" ? "/admin" : "/quizzes",
  })
}
