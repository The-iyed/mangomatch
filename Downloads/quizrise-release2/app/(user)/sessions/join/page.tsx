"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Users, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function JoinSessionPage() {
  const [accessCode, setAccessCode] = useState("")
  const [participantName, setParticipantName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // Pre-fill access code if provided in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setAccessCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  async function handleJoinSession(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Find the session with this access code
      const { data: session, error: sessionError } = await supabase
        .from("quiz_sessions")
        .select(`
          *,
          quiz:quiz_id(id, title, description)
        `)
        .eq("access_code", accessCode.toUpperCase())
        .eq("status", "active")
        .single()

      if (sessionError) {
        throw new Error("Invalid or expired access code. Please check the code and try again.")
      }

      // Get the current user if logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Check if user has already joined this session
      if (user) {
        const { data: existingParticipant } = await supabase
          .from("session_participants")
          .select("id")
          .eq("session_id", session.id)
          .eq("user_id", user.id)
          .single()

        if (existingParticipant) {
          toast({
            title: "Already Joined",
            description: "You have already joined this session. Redirecting...",
          })
          router.push(`/sessions/${session.id}/participate?participant=${existingParticipant.id}`)
          return
        }
      }

      // Create a participant record - using display_name instead of participant_name
      const { data: participant, error: participantError } = await supabase
        .from("session_participants")
        .insert({
          session_id: session.id,
          user_id: user?.id || null,
          display_name: participantName, // Changed from participant_name to display_name
          score: 0,
          max_score: 0,
          time_taken: 0,
          completed: false,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (participantError) {
        console.error("Participant error:", participantError)
        throw new Error("Failed to join session. Please try again.")
      }

      toast({
        title: "Success!",
        description: `Welcome to "${session.quiz?.title}" session!`,
        duration: 3000,
      })

      // Redirect to the session participation page
      router.push(`/sessions/${session.id}/participate?participant=${participant.id}`)
    } catch (error: any) {
      console.error("Error joining session:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join Quiz Session</h2>
          <p className="mt-2 text-sm text-gray-600">Enter the access code to join a live quiz session</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Session Access</CardTitle>
            <CardDescription>Enter your details to join the quiz session</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSession} className="space-y-6">
              <div>
                <Label htmlFor="accessCode" className="text-sm font-medium">
                  Access Code
                </Label>
                <Input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  required
                  className="uppercase font-mono text-center text-lg tracking-widest mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the code provided by your instructor</p>
              </div>

              <div>
                <Label htmlFor="participantName" className="text-sm font-medium">
                  Your Name
                </Label>
                <Input
                  id="participantName"
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">This will be displayed on the leaderboard</p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={loading || !accessCode || !participantName}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining Session...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Join Session
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an access code?{" "}
            <a href="/quizzes" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Browse available quizzes
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
