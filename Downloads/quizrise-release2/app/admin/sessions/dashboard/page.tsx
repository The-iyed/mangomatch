import { Suspense } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Calendar, Plus } from "lucide-react"

// Format date for display
function formatDate(date: string | null): string {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  })
}

// Format duration in minutes to hours and minutes
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

// Get status badge color
function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "completed":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

async function getSessionsData() {
  const supabase = createServerComponentClient({ cookies })

  // Get active sessions
  const { data: activeSessions } = await supabase
    .from("quiz_sessions")
    .select(`
      *,
      quiz:quiz_id(title),
      participant_count:session_participants(count)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  // Get pending sessions
  const { data: pendingSessions } = await supabase
    .from("quiz_sessions")
    .select(`
      *,
      quiz:quiz_id(title),
      participant_count:session_participants(count)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get completed sessions
  const { data: completedSessions } = await supabase
    .from("quiz_sessions")
    .select(`
      *,
      quiz:quiz_id(title),
      participant_count:session_participants(count)
    `)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get recent participants
  const { data: recentParticipants } = await supabase
    .from("session_participants")
    .select(`
      *,
      session:session_id(title)
    `)
    .order("joined_at", { ascending: false })
    .limit(5)

  return {
    activeSessions: activeSessions || [],
    pendingSessions: pendingSessions || [],
    completedSessions: completedSessions || [],
    recentParticipants: recentParticipants || [],
  }
}

function SessionCard({ session }: { session: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <CardDescription>{session.quiz?.title || "Unknown Quiz"}</CardDescription>
          </div>
          <Badge className={getStatusColor(session.status)}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(session.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{session.participant_count?.[0]?.count || 0} participants</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Started: {formatDate(session.start_time)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              Code: {session.access_code}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/admin/sessions/${session.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

function SessionsGrid({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No sessions found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  )
}

function SessionsDashboardContent() {
  return (
    <Suspense fallback={<div>Loading sessions data...</div>}>
      <SessionsData />
    </Suspense>
  )
}

async function SessionsData() {
  const { activeSessions, pendingSessions, completedSessions, recentParticipants } = await getSessionsData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sessions Dashboard</h1>
        <Link href="/admin/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeSessions.reduce((sum, session) => sum + (session.participant_count?.[0]?.count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="pending">Pending Sessions</TabsTrigger>
          <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <SessionsGrid sessions={activeSessions} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <SessionsGrid sessions={pendingSessions} />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <SessionsGrid sessions={completedSessions} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Participants</CardTitle>
          <CardDescription>Latest users who joined quiz sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentParticipants.length === 0 ? (
            <p className="text-muted-foreground">No recent participants</p>
          ) : (
            <div className="space-y-4">
              {recentParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{participant.participant_name}</p>
                    <p className="text-sm text-muted-foreground">Joined: {formatDate(participant.joined_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm">{participant.session?.title || "Unknown Session"}</p>
                    <p className="text-sm text-muted-foreground">Score: {participant.score || "Not completed"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SessionsDashboard() {
  return (
    <div className="container py-6">
      <SessionsDashboardContent />
    </div>
  )
}
