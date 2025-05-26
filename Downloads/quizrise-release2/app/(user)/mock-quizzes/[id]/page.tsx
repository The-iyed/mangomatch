"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMockQuiz } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Clock, Award, ChevronLeft, AlertTriangle } from "lucide-react"

export default function QuizDetailsPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate API call with a small delay
    const timer = setTimeout(() => {
      const quizData = getMockQuiz(params.id)
      setQuiz(quizData)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mb-2 mt-4 text-xl font-semibold">Quiz Not Found</h2>
          <p className="mb-4 text-muted-foreground">The quiz you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/mock-quizzes">Back to Quizzes</Link>
          </Button>
        </div>
      </div>
    )
  }

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

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/mock-quizzes">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{quiz.category}</Badge>
          <Badge variant={getDifficultyVariant(quiz.difficulty)} className="capitalize">
            {quiz.difficulty}
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="h-2 w-full bg-primary"></div>
        <CardHeader>
          <CardTitle>Quiz Overview</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Questions</div>
                <div className="mt-1 text-2xl font-bold">{quiz.questions.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Time Limit</div>
                <div className="mt-1 text-2xl font-bold">{quiz.timeLimit} min</div>
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
            <h3 className="mb-2 text-sm font-medium">Instructions</h3>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Read each question carefully before answering</li>
              <li>Select the best answer for each question</li>
              <li>You can review your answers before submitting</li>
              <li>Your score will be displayed at the end of the quiz</li>
              <li>You have {quiz.timeLimit} minutes to complete this quiz</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 p-4">
          <Button className="w-full" size="lg" asChild>
            <Link href={`/mock-quizzes/${quiz.id}/take`}>Start Quiz</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
