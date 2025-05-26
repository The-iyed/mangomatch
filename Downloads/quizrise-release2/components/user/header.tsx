"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BrainCircuit } from "lucide-react"
import Link from "next/link"
import { getClientSupabaseInstance } from "@/lib/supabase"

export function UserHeader() {
  const [profile, setProfile] = useState<any>(null)
  const supabase = getClientSupabaseInstance()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", sessionData.session.user.id).single()

        setProfile(data)
      }
    }

    fetchProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">QuizRise</span>
        </Link>

        <nav className="hidden space-x-6 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/quizzes" className="text-sm font-medium transition-colors hover:text-primary">
            Quizzes
          </Link>
          <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
            Categories
          </Link>
          <Link href="/my-quizzes" className="text-sm font-medium transition-colors hover:text-primary">
            My Quizzes
          </Link>
          <Link href="/mock-quizzes" className="text-sm font-medium transition-colors hover:text-primary">
            Practice
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {profile.full_name || profile.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
