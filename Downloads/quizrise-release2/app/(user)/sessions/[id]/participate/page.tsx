"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trophy, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SessionData {
  id: string
  title: string
  description: string
  duration_minutes: number
  status: string
  start_time: string
  quiz: {
    id: string
    title: string
    description: string
  }
}

export default function SessionParticipatePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const sessionId = params.id as string
  const participantId = searchParams.get("participant")

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    async function fetchSession() {
      try {
        const { data, error } = await supabase
          .from("quiz_sessions")
          .select(`
            *,
            quiz:quiz_id(id, title, description)
          `)
          .eq("id", sessionId)
          .single()

        if (error) throw error
        setSession(data)

        // Calculate time remaining
        if (data.start_time && data.status === "active") {
          const startTime = new Date(data.start_time).getTime()
          const endTime = startTime + data.duration_minutes * 60 * 1000
          const now = Date.now()
          const remaining = Math.max(0, endTime - now)
          setTimeRemaining(remaining)
        }
      } catch (error) {
        console.error("Error fetching session:", error)
        toast({
          title: "Error",
          description: "Failed to load session details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, supabase, toast])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1000
          if (newTime <= 0) {
            toast({
              title: "Time's Up!",
              description: "The session has ended.",
            })
          }
          return Math.max(0, newTime)
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining, toast])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleStartQuiz = () => {
    if (session?.quiz?.id) {
      router.push(`/quizzes/${session.quiz.id}/take?session=${sessionId}&participant=${participantId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">The session you're looking for doesn't exist or has ended.</p>
            <Button onClick={() => router.push("/sessions/join")}>Join Another Session</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Session Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <Badge variant={session.status === "active" ? "default" : "secondary"}>
                {session.status.toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{session.title}</CardTitle>
            <CardDescription className="text-base">{session.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Quiz Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quiz: {session.quiz?.title}
            </CardTitle>
            <CardDescription>{session.quiz?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{session.duration_minutes} minutes</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className="font-semibold text-lg">{timeRemaining > 0 ? formatTime(timeRemaining) : "Ended"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Card>
          <CardContent className="text-center p-6">
            {session.status === "active" && timeRemaining > 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Ready to Start?</h3>
                <Button onClick={handleStartQuiz} size="lg" className="w-full max-w-sm">
                  Start Quiz
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-gray-600 mt-2">Click to begin taking the quiz</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Session Ended</h3>
                <p className="text-gray-600 mb-4">
                  This session has ended. Check back for results or join another session.
                </p>
                <Button onClick={() => router.push("/sessions/join")} variant="outline">
                  Join Another Session
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
