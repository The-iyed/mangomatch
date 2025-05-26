"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Award } from "lucide-react"

interface LeaderboardEntry {
  id: string
  participant_name: string
  score: number
  max_score: number
  time_taken: number
  rank: number
}

export default function SessionResultsPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Get participant ID from URL
  const participantId = searchParams.get("pid")

  useEffect(() => {
    async function fetchResults() {
      if (!participantId) {
        toast({
          title: "Error",
          description: "Participant ID is missing",
          variant: "destructive",
        })
        router.push("/sessions/join")
        return
      }

      try {
        // Get session details
        const { data: sessionData } = await supabase
          .from("quiz_sessions")
          .select(`
            *,
            quiz:quizzes(title, description)
          `)
          .eq("id", params.id)
          .single()

        if (!sessionData) {
          throw new Error("Session not found")
        }

        // Get participant details
        const { data: participantData } = await supabase
          .from("session_participants")
          .select("*")
          .eq("id", participantId)
          .single()

        if (!participantData) {
          throw new Error("Participant not found")
        }

        // Get participant answers
        const { data: answersData } = await supabase
          .from("session_participant_answers")
          .select(`
            *,
            question:question_id(question_text),
            answer:answer_id(answer_text)
          `)
          .eq("participant_id", participantId)

        // Get leaderboard
        const { data: leaderboardData } = await supabase
          .from("session_participants")
          .select("*")
          .eq("session_id", params.id)
          .eq("completed", true)
          .order("score", { ascending: false })
          .order("time_taken", { ascending: true })

        if (!leaderboardData) {
          throw new Error("Failed to load leaderboard")
        }

        // Calculate rank for each participant
        const processedLeaderboard = leaderboardData.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))

        // Find current participant's rank
        const currentParticipant = processedLeaderboard.find((entry) => entry.id === participantId)

        setParticipant(currentParticipant)
        setLeaderboard(processedLeaderboard.slice(0, 10)) // Top 10
        setAnswers(answersData || [])
      } catch (error: any) {
        console.error("Error fetching results:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load results",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [params.id, participantId, router])

  function formatTime(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p>Loading results...</p>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-500">Participant Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">We couldn't find your participant record for this session.</p>
            <Button onClick={() => router.push("/sessions/join")}>Join Another Session</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const accuracy = participant.max_score > 0 ? Math.round((participant.score / participant.max_score) * 100) : 0

  const rankIcon = participant.rank === 1 ? <Award className="h-8 w-8 text-yellow-500" /> : null

  return (
    <div className="container max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Quiz Results</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Your Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            {rankIcon && <div className="mb-2">{rankIcon}</div>}
            <h2 className="text-3xl font-bold">Rank: {participant.rank}</h2>
            <p className="text-muted-foreground">out of {leaderboard.length} participants</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">
                {participant.score}/{participant.max_score}
              </div>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{accuracy}%</div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{formatTime(participant.time_taken)}</div>
              <p className="text-sm text-muted-foreground">Time Taken</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Accuracy</span>
              <span>{accuracy}%</span>
            </div>
            <Progress value={accuracy} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/quizzes")}>Browse More Quizzes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top performers in this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.id === participant.id ? "bg-primary/10 border border-primary/20" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-medium">
                      {entry.participant_name || "Anonymous"}
                      {entry.id === participant.id && <span className="ml-2 text-xs text-primary">(You)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score: {entry.score}/{entry.max_score}
                    </div>
                  </div>
                </div>
                <div className="text-sm">{formatTime(entry.time_taken)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {answers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No answers submitted</p>
            ) : (
              answers.map((answer) => (
                <div key={answer.id} className="border rounded-md p-4">
                  <div className="flex items-start gap-2">
                    {answer.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{answer.question.question_text}</p>
                      <p className={`mt-1 ${answer.is_correct ? "text-green-600" : "text-red-600"}`}>
                        Your answer: {answer.answer.answer_text}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    </div>
  )
}
