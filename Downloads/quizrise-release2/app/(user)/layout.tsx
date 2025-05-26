"use client"

import type React from "react"
import { UserHeader } from "@/components/user/header"
import { UserFooter } from "@/components/user/footer"
import { useEffect, useState } from "react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const supabase = getClientSupabaseInstance()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData.session) {
          // Not logged in, redirect to login
          window.location.href = "/login"
          return
        }

        // Check if user is admin with email containing "admin"
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", sessionData.session.user.id)
          .single()

        if (profile?.role === "admin" && profile.email?.includes("admin")) {
          // Admin user, redirect to admin dashboard
          window.location.href = "/admin"
          return
        }

        // Regular user, allow access
        setIsAuthorized(true)
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking user auth:", error)
        // On error, redirect to login
        window.location.href = "/login"
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // This shouldn't render as we redirect unauthorized users
  }

  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader />
      <main className="flex-1 bg-muted/20">{children}</main>
      <UserFooter />
    </div>
  )
}
