"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Clock, BookOpen, BarChart, Award, ChevronLeft, Trophy, Users, Calendar } from "lucide-react"

export default function QuizPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [questionCount, setQuestionCount] = useState(0)
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const router = useRouter()
  const supabase = getClientSupabaseInstance()

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true)

        // Fetch quiz with category
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories:category_id (name)
          `)
          .eq("id", params.id)
          .single()

        if (quizError) throw quizError
        setQuiz(quizData)

        // Fetch question count
        const { count, error: countError } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", params.id)

        if (countError) throw countError
        setQuestionCount(count || 0)

        // Fetch recent attempts by current user
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          const { data: attemptsData } = await supabase
            .from("quiz_attempts")
            .select("*")
            .eq("quiz_id", params.id)
            .eq("user_id", sessionData.session.user.id)
            .order("completed_at", { ascending: false })
            .limit(3)

          setRecentAttempts(attemptsData || [])

          // Fetch leaderboard (top 5 scores)
          const { data: leaderboardData } = await supabase
            .from("quiz_attempts")
            .select(`
              *,
              profiles:user_id (full_name, email)
            `)
            .eq("quiz_id", params.id)
            .eq("completed", true)
            .order("score", { ascending: false })
            .order("time_taken", { ascending: true })
            .limit(5)

          setLeaderboard(leaderboardData || [])
        }
      } catch (error) {
        console.error("Error fetching quiz:", error)
        router.push("/quizzes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizData()
  }, [params.id, router])

  // Get difficulty badge variant
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "outline"
      case "medium":
        return "secondary"
      case "hard":
        return "default"
      default:
        return "outline"
    }
  }

  // Get estimated time based on question count
  const getEstimatedTime = (count: number) => {
    return Math.ceil(count * 1.5)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Quiz Not Found</h2>
          <p className="mb-4 text-muted-foreground">The quiz you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/quizzes">Back to Quizzes</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/quizzes">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{quiz.categories?.name || "Uncategorized"}</Badge>
          <Badge variant={getDifficultyVariant(quiz.difficulty)}>{quiz.difficulty}</Badge>
          <Badge variant="outline">{quiz.source_type}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="h-2 w-full bg-primary"></div>
            <CardHeader>
              <CardTitle>Quiz Overview</CardTitle>
              <CardDescription>{quiz.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Questions</div>
                    <div className="mt-1 text-2xl font-bold">{questionCount}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Est. Time</div>
                    <div className="mt-1 text-2xl font-bold">{getEstimatedTime(questionCount)} min</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Difficulty</div>
                    <div className="mt-1 text-2xl font-bold capitalize">{quiz.difficulty}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Created {formatDate(quiz.created_at)}
                </h3>
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium">Instructions</h3>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Read each question carefully before answering</li>
                    <li>Select the best answer for each question</li>
                    <li>You can flag questions to review later</li>
                    <li>Your score will be displayed at the end of the quiz</li>
                    <li>You can retake the quiz to improve your score</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 p-4">
              <Button className="w-full" size="lg" asChild>
                <Link href={`/quizzes/${quiz.id}/take`}>Start Quiz</Link>
              </Button>
            </CardFooter>
          </Card>

          {leaderboard.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {leaderboard.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((attempt, index) => (
                    <div key={attempt.id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                  ? "bg-amber-700"
                                  : "bg-muted"
                          } text-white font-medium`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {attempt.profiles?.full_name || attempt.profiles?.email.split("@")[0] || "Anonymous"}
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDate(attempt.completed_at)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {attempt.score}/{attempt.max_score} ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                        </div>
                        <div className="text-xs text-muted-foreground">Time: {formatTime(attempt.time_taken)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {recentAttempts.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="h-2 w-full bg-primary/70"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Your Recent Attempts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAttempts.map((attempt) => {
                  const percentage = Math.round((attempt.score / attempt.max_score) * 100)
                  const isPassing = percentage >= 70

                  return (
                    <div key={attempt.id} className="overflow-hidden rounded-md border">
                      <div className={`h-1 w-full ${isPassing ? "bg-green-500" : "bg-amber-500"}`}></div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            {formatDate(attempt.completed_at || attempt.created_at)}
                          </div>
                          <Badge variant={isPassing ? "default" : "outline"}>
                            {attempt.score}/{attempt.max_score}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${isPassing ? "bg-green-500" : "bg-amber-500"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{percentage}% Score</span>
                            <span>Time: {formatTime(attempt.time_taken || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-dashed p-6 text-center">
                  <BarChart className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't taken this quiz yet. Start now to track your progress!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
