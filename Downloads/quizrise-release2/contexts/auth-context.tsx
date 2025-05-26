"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  user: User | null
  profile: any | null
  refreshSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: any; redirectTo?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)

  // Use memoized Supabase client to prevent re-creation
  const supabase = useMemo(() => getClientSupabaseInstance(), [])

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        setUser(null)
        setProfile(null)
        return
      }

      // User is authenticated
      setUser(data.user)
      setIsAuthenticated(true)

      // Check if user is admin
      try {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

        setProfile(profileData)
        setIsAdmin(profileData?.role === "admin")
      } catch (err) {
        console.error("Error checking admin status:", err)
        setIsAdmin(false)
      }
    } catch (err) {
      console.error("Auth refresh error:", err)
    }
  }

  useEffect(() => {
    let mounted = true

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        await refreshSession()
      } catch (err) {
        console.error("Auth check error:", err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_IN" && session) {
        setUser(session.user)
        setIsAuthenticated(true)

        // Check if user is admin
        try {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setProfile(profileData)
          setIsAdmin(profileData?.role === "admin")
        } catch (err) {
          console.error("Error checking admin status:", err)
          setIsAdmin(false)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setIsAuthenticated(false)
        setIsAdmin(false)
        setProfile(null)
      }
    })

    checkAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // Successfully signed in
      setUser(data.user)
      setIsAuthenticated(true)

      // Check if user is admin to determine redirect
      try {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

        setProfile(profileData)
        const isAdmin = profileData?.role === "admin"
        setIsAdmin(isAdmin)

        return {
          error: null,
          redirectTo: isAdmin ? "/admin" : "/quizzes",
        }
      } catch (err) {
        console.error("Error checking role:", err)
        // Default redirect if profile check fails
        return { error: null, redirectTo: "/quizzes" }
      }
    } catch (err) {
      console.error("Sign in error:", err)
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      return { error }
    } catch (err) {
      console.error("Sign up error:", err)
      return { error: err }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
      setProfile(null)
      window.location.href = "/login"
    } catch (err) {
      console.error("Sign out error:", err)
      window.location.href = "/login"
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isLoading,
        user,
        profile,
        refreshSession,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
