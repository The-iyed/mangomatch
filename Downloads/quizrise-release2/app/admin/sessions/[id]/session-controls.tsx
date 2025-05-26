"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startQuizSession, endQuizSession } from "@/app/actions/sessions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Play, StopCircle } from "lucide-react"

interface SessionControlsProps {
  session: any
}

export function SessionControls({ session }: SessionControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isActive = session.status === "active"
  const isPending = session.status === "pending"
  const isCompleted = session.status === "completed"

  async function handleStartSession() {
    setIsLoading(true)
    try {
      const result = await startQuizSession(session.id)
      if (result.success) {
        toast({
          title: "Session Started",
          description: "The quiz session has been started successfully.",
        })
        router.refresh()
      } else {
        throw new Error(result.error || "Failed to start session")
      }
    } catch (error) {
      console.error("Error starting session:", error)
      toast({
        title: "Error",
        description: "Failed to start the session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEndSession() {
    setIsLoading(true)
    try {
      const result = await endQuizSession(session.id)
      if (result.success) {
        toast({
          title: "Session Ended",
          description: "The quiz session has been ended successfully.",
        })
        router.refresh()
      } else {
        throw new Error(result.error || "Failed to end session")
      }
    } catch (error) {
      console.error("Error ending session:", error)
      toast({
        title: "Error",
        description: "Failed to end the session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCompleted) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Controls</CardTitle>
        <CardDescription>Manage the current quiz session</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && <p>This session hasn't started yet. Click the button below to start the session.</p>}
        {isActive && (
          <p>
            This session is currently active. Participants can join and take the quiz. Click the button below to end the
            session.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {isPending && (
          <Button onClick={handleStartSession} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Session
              </>
            )}
          </Button>
        )}
        {isActive && (
          <Button onClick={handleEndSession} variant="destructive" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                End Session
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
