"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const { user, profile, isAdmin, refreshSession } = useAuth()

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const checkAuth = async () => {
      try {
        // If we already have user and profile data from context, use it
        if (user) {
          if (isAdmin) {
            if (isMounted) {
              setIsAuthorized(true)
              setIsLoading(false)
            }
          } else {
            // Not an admin, redirect to user dashboard
            if (isMounted) {
              setIsLoading(false)
            }
            router.push("/quizzes")
          }
          return
        }

        // If no user in context, wait a bit for auth context to initialize
        timeoutId = setTimeout(() => {
          if (isMounted && isLoading) {
            // If still loading after timeout, try to refresh the session
            refreshSession().then(() => {
              if (!user) {
                // If still no user after refresh, redirect to login
                router.push("/login")
              }
            })
          }
        }, 3000)
      } catch (error) {
        console.error("Error checking admin auth:", error)
        // On error, redirect to login
        if (isMounted) {
          setIsLoading(false)
        }
        router.push("/login")
      }
    }

    checkAuth()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [user, profile, isAdmin])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized && !isAdmin) {
    // Redirect to login instead of showing unauthorized message
    router.push("/login")
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  )
}
