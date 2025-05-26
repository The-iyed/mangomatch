"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Play, Square, Copy, Users, Clock, Trophy, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDateTime } from "@/lib/utils"

interface SessionDetails {
  id: string
  title: string
  description: string
  duration_minutes: number
  access_code: string
  status: "pending" | "active" | "completed"
  start_time: string | null
  end_time: string | null
  created_at: string
  quiz: {
    id: string
    title: string
    description: string
  }
  participants: Array<{
    id: string
    participant_name: string
    score: number
    max_score: number
    time_taken: number
    completed: boolean
    joined_at: string
    completed_at: string | null
  }>
}

export default function SessionDetailPage() {
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const sessionId = params.id as string

  useEffect(() => {
    fetchSessionDetails()
  }, [sessionId])

  async function fetchSessionDetails() {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("quiz_sessions")
        .select(`
          *,
          quiz:quiz_id(id, title, description)
        `)
        .eq("id", sessionId)
        .single()

      if (sessionError) throw sessionError

      const { data: participantsData, error: participantsError } = await supabase
        .from("session_participants")
        .select("*")
        .eq("session_id", sessionId)
        .order("score", { ascending: false })

      if (participantsError) throw participantsError

      setSession({
        ...sessionData,
        participants: participantsData || [],
      })
    } catch (error) {
      console.error("Error fetching session details:", error)
      toast({
        title: "Error",
        description: "Failed to load session details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function startSession() {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from("quiz_sessions")
        .update({
          status: "active",
          start_time: new Date().toISOString(),
        })
        .eq("id", sessionId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Session started successfully!",
      })

      fetchSessionDetails()
    } catch (error) {
      console.error("Error starting session:", error)
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  async function endSession() {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from("quiz_sessions")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
        })
        .eq("id", sessionId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Session ended successfully!",
      })

      fetchSessionDetails()
    } catch (error) {
      console.error("Error ending session:", error)
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  function copyShareLink() {
    const shareUrl = `${window.location.origin}/sessions/join?code=${session?.access_code}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard!",
    })
  }

  function copyAccessCode() {
    if (session?.access_code) {
      navigator.clipboard.writeText(session.access_code)
      toast({
        title: "Code Copied",
        description: "Access code has been copied to clipboard!",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Session Not Found</h2>
        <p className="text-muted-foreground mt-2">The session you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "active":
        return <Badge variant="default">Active</Badge>
      case "completed":
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const calculateAccuracy = (score: number, maxScore: number) => {
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
          <p className="text-muted-foreground">{session.description}</p>
          <div className="flex items-center gap-4 mt-2">
            {getStatusBadge(session.status)}
            <span className="text-sm text-muted-foreground">Quiz: {session.quiz.title}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {session.status === "pending" && (
            <Button onClick={startSession} disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Start Session
            </Button>
          )}
          {session.status === "active" && (
            <Button onClick={endSession} variant="destructive" disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
              End Session
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              Share Session
            </CardTitle>
            <CardDescription>Share this session with participants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Access Code</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-3 py-2 rounded text-lg font-mono flex-1">{session.access_code}</code>
                <Button size="sm" variant="outline" onClick={copyAccessCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={`${window.location.origin}/sessions/join?code=${session.access_code}`}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded text-sm bg-muted"
                />
                <Button size="sm" variant="outline" onClick={copyShareLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="text-sm font-medium">{session.duration_minutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created:</span>
              <span className="text-sm font-medium">{formatDateTime(session.created_at)}</span>
            </div>
            {session.start_time && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Started:</span>
                <span className="text-sm font-medium">{formatDateTime(session.start_time)}</span>
              </div>
            )}
            {session.end_time && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ended:</span>
                <span className="text-sm font-medium">{formatDateTime(session.end_time)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Participants:</span>
              <span className="text-sm font-medium">{session.participants.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>Participant performance and rankings</CardDescription>
        </CardHeader>
        <CardContent>
          {session.participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No participants yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Share the access code or link to get participants to join.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.participants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{participant.participant_name || "Anonymous"}</TableCell>
                    <TableCell>
                      {participant.score}/{participant.max_score}
                    </TableCell>
                    <TableCell>{calculateAccuracy(participant.score, participant.max_score)}%</TableCell>
                    <TableCell>{Math.round(participant.time_taken / 60)} min</TableCell>
                    <TableCell>
                      <Badge variant={participant.completed ? "default" : "secondary"}>
                        {participant.completed ? "Completed" : "In Progress"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(participant.joined_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
