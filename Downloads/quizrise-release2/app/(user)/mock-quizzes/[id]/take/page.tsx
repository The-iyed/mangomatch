"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { getMockQuiz, type MockQuiz, type MockQuestion } from "@/lib/mock-data"
import { ChevronLeft, ChevronRight, Clock, Flag, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import confetti from "canvas-confetti"
// Import the singleton client instead of creating a new one
import { getClientSupabaseInstance } from "@/lib/supabase"

// Define the Answer type based on your database schema
interface Answer {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean
  created_at?: string
  updated_at?: string
}

// Define the Question type with answers
interface Question {
  id: string
  question_text: string
  explanation?: string
  order_num: number
  quiz_id: string
  answers: Answer[]
}

export default function TakeQuizPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<MockQuiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [allAnswers, setAllAnswers] = useState<Answer[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(true)
  const [isFetchingAnswers, setIsFetchingAnswers] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [timeStarted, setTimeStarted] = useState<Date | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const router = useRouter()
  const { toast } = useToast()

  // Use the singleton pattern to get the Supabase client
  const supabase = getClientSupabaseInstance()

  // Fetch all answers from the database (without filtering)
  const fetchAllAnswers = async () => {
    setIsFetchingAnswers(true)
    try {
      // Try to fetch all answers first to see if we can access the table
      const { data, error } = await supabase.from("answers").select("*")

      if (error) {
        console.error("Error fetching all answers:", error)
        setDebugInfo((prev) => ({ ...prev, allAnswersError: error }))
        toast({
          title: "Error fetching all answers",
          description: error.message,
          variant: "destructive",
        })
        return null
      }

      console.log("All answers from database:", data)
      setAllAnswers(data)
      setDebugInfo((prev) => ({ ...prev, allAnswers: data }))

      return data
    } catch (err) {
      console.error("Exception when fetching all answers:", err)
      setDebugInfo((prev) => ({ ...prev, allAnswersException: err }))
      return null
    } finally {
      setIsFetchingAnswers(false)
    }
  }

  // Fetch questions with answers for the specific quiz
  const fetchQuestionsWithAnswers = async (quizId: string) => {
    setIsFetchingQuestions(true)
    setDebugInfo({})
    try {
      // First, fetch questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          explanation,
          order_num,
          quiz_id
        `)
        .eq("quiz_id", quizId)
        .order("order_num", { ascending: true })

      if (questionsError) {
        console.error("Error fetching questions:", questionsError)
        setDebugInfo((prev) => ({ ...prev, questionsError }))
        toast({
          title: "Error fetching questions",
          description: questionsError.message,
          variant: "destructive",
        })
        return
      }

      if (!questionsData || questionsData.length === 0) {
        console.log("No questions found for this quiz")
        setDebugInfo((prev) => ({ ...prev, noQuestionsFound: true }))
        toast({
          title: "No questions found",
          description: "This quiz doesn't have any questions yet",
          variant: "destructive",
        })
        return
      }

      console.log("Successfully fetched questions:", questionsData)
      setDebugInfo((prev) => ({ ...prev, questions: questionsData }))

      // Now fetch all answers first
      const allAnswersData = await fetchAllAnswers()

      // If we got all answers, filter them for our questions
      let answersForQuestions: Answer[] = []
      if (allAnswersData && allAnswersData.length > 0) {
        // Extract question IDs
        const questionIds = questionsData.map((q) => q.id)
        console.log("Question IDs for filtering answers:", questionIds)
        setDebugInfo((prev) => ({ ...prev, questionIds }))

        // Filter answers that match our question IDs
        answersForQuestions = allAnswersData.filter((answer) => questionIds.includes(answer.question_id))

        console.log("Filtered answers for our questions:", answersForQuestions)
        setDebugInfo((prev) => ({ ...prev, answersForQuestions }))
      } else {
        // Try direct query as a fallback
        console.log("No answers found in general query, trying direct query...")

        // Extract question IDs
        const questionIds = questionsData.map((q) => q.id)

        // Try a direct query for answers with these question IDs
        const { data: directAnswersData, error: directAnswersError } = await supabase
          .from("answers")
          .select("*")
          .in("question_id", questionIds)

        if (directAnswersError) {
          console.error("Error in direct answers query:", directAnswersError)
          setDebugInfo((prev) => ({ ...prev, directAnswersError }))
        } else {
          console.log("Direct answers query result:", directAnswersData)
          setDebugInfo((prev) => ({ ...prev, directAnswersData }))
          answersForQuestions = directAnswersData || []
        }
      }

      // Combine questions with their answers
      const questionsWithAnswers = questionsData.map((question) => {
        const questionAnswers = answersForQuestions.filter((answer) => answer.question_id === question.id) || []

        return {
          ...question,
          answers: questionAnswers,
        }
      })

      setQuestions(questionsWithAnswers)
      setDebugInfo((prev) => ({ ...prev, questionsWithAnswers }))

      // Display success message
      toast({
        title: "Success",
        description: `Fetched ${questionsData.length} questions with ${answersForQuestions.length} answers`,
      })

      // Set up quiz data based on fetched questions
      const quizData: MockQuiz = {
        id: quizId,
        title: "Quiz from Database",
        description: "This quiz is loaded from the database",
        timeLimit: 30, // Default time limit in minutes
        difficulty: "medium",
        category: "Database Quiz",
        questions: questionsWithAnswers.map((q) => ({
          id: q.id,
          text: q.question_text,
          explanation: q.explanation || "",
          answers: q.answers.map((a) => ({
            id: a.id,
            text: a.answer_text,
            isCorrect: a.is_correct,
          })),
        })),
      }

      setQuiz(quizData)
      setTimeRemaining(quizData.timeLimit * 60)
      setTimeStarted(new Date())
      setIsLoading(false)
    } catch (err) {
      console.error("Exception when fetching questions:", err)
      setDebugInfo((prev) => ({ ...prev, mainException: err }))
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching questions and answers",
        variant: "destructive",
      })
    } finally {
      setIsFetchingQuestions(false)
    }
  }

  // Fetch questions and answers when component mounts
  useEffect(() => {
    // Use the quiz ID from params, or use the specific ID if testing
    const quizId = params.id === "test" ? "ed5997c5-fd8d-4177-a156-2e84c600a40a" : params.id
    fetchQuestionsWithAnswers(quizId)
  }, [params.id])

  // Debug log when questions state changes
  useEffect(() => {
    if (questions) {
      console.log(`Questions state updated with ${questions.length} questions:`, questions)

      // Log answers for each question
      questions.forEach((question, index) => {
        console.log(
          `Question ${index + 1} has ${question.answers.length} answers:`,
          question.answers.map((a) => ({
            id: a.id,
            text: a.answer_text,
            isCorrect: a.is_correct,
          })),
        )
      })
    }
  }, [questions])

  // Only load mock data if we don't have real data
  useEffect(() => {
    if (!questions && !isFetchingQuestions) {
      // Fallback to mock data if no real data is available
      const timer = setTimeout(() => {
        const quizData = getMockQuiz(params.id)
        if (quizData) {
          setQuiz(quizData)
          setTimeRemaining(quizData.timeLimit * 60) // Convert minutes to seconds
          setTimeStarted(new Date())
        }
        setIsLoading(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [params.id, questions, isFetchingQuestions])

  // Timer effect
  useEffect(() => {
    if (!timeStarted || isReviewing) return

    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - timeStarted.getTime()) / 1000)
      setTimeElapsed(elapsed)

      // Calculate remaining time
      if (quiz) {
        const remaining = Math.max(0, quiz.timeLimit * 60 - elapsed)
        setTimeRemaining(remaining)

        // Auto-submit when time runs out
        if (remaining === 0 && !isReviewing) {
          clearInterval(interval)
          handleSubmit(true)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeStarted, isReviewing, quiz])

  const currentQuestion = quiz?.questions[currentQuestionIndex]

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (showAnswer) return // Prevent changing answer after revealing

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }))
  }

  const toggleFlagQuestion = (index: number) => {
    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(index)) {
      newFlagged.delete(index)
    } else {
      newFlagged.add(index)
    }
    setFlaggedQuestions(newFlagged)
  }

  const handleNext = useCallback(() => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setShowAnswer(false)
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }, [currentQuestionIndex, quiz])

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setShowAnswer(false)
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleJumpToQuestion = (index: number) => {
    setShowAnswer(false)
    setCurrentQuestionIndex(index)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleRevealAnswer = () => {
    setShowAnswer(true)
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (showConfirmSubmit || autoSubmit) {
      await submitQuiz()
      setShowConfirmSubmit(false)
    } else {
      setShowConfirmSubmit(true)
    }
  }

  const submitQuiz = async () => {
    if (!quiz) return

    setIsSubmitting(true)

    try {
      // Calculate score
      let correctCount = 0

      quiz.questions.forEach((question) => {
        const selectedAnswerId = selectedAnswers[question.id]
        if (selectedAnswerId) {
          const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId)
          if (selectedAnswer?.isCorrect) {
            correctCount++
          }
        }
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setScore(correctCount)
      setIsReviewing(true)

      // Show confetti for good scores
      if (correctCount / quiz.questions.length >= 0.7) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
        }, 500)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAnswerStatusClass = (question: MockQuestion, answerId: string) => {
    if (!showAnswer && !isReviewing) return ""

    const isSelected = selectedAnswers[question.id] === answerId
    const isCorrect = question.answers.find((a) => a.id === answerId)?.isCorrect

    if (isSelected && isCorrect) return "bg-green-100 border-green-500 dark:bg-green-900/20"
    if (isSelected && !isCorrect) return "bg-red-100 border-red-500 dark:bg-red-900/20"
    if (!isSelected && isCorrect) return "bg-green-50 border-green-300 dark:bg-green-900/10"

    return ""
  }

  // Add a button to manually fetch questions (for debugging)
  const DebugPanel = () => (
    <div className="mb-4 rounded-md border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="mb-2 font-medium">Database Debug Panel</h3>
      <div className="mb-2 text-sm">
        {isFetchingQuestions ? (
          <p>Fetching questions and answers...</p>
        ) : questions ? (
          <div>
            <p>Fetched {questions.length} questions from database</p>
            <p>Total answers: {questions.reduce((sum, q) => sum + q.answers.length, 0)}</p>
            {allAnswers && <p>All answers in database: {allAnswers.length}</p>}
          </div>
        ) : (
          <p>No questions fetched yet</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            fetchQuestionsWithAnswers(params.id === "test" ? "ed5997c5-fd8d-4177-a156-2e84c600a40a" : params.id)
          }
          disabled={isFetchingQuestions}
        >
          {isFetchingQuestions ? "Fetching..." : "Refresh Questions"}
        </Button>

        <Button size="sm" variant="outline" onClick={fetchAllAnswers} disabled={isFetchingAnswers}>
          {isFetchingAnswers ? "Fetching..." : "Fetch All Answers"}
        </Button>
      </div>

      <div className="mt-4">
        <details>
          <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <h3 className="mt-2 text-lg font-semibold">Quiz Not Found</h3>
          <p className="mt-2 text-muted-foreground">
            There was a problem loading this quiz. Please try again or contact support.
          </p>
          <Button className="mt-4" onClick={() => router.push("/mock-quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  if (isReviewing && score !== null) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    const isPassing = percentage >= 70

    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="overflow-hidden">
          <div className={`h-2 w-full ${isPassing ? "bg-green-500" : "bg-amber-500"}`}></div>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-muted bg-background">
                  <span className="text-4xl font-bold">{percentage}%</span>
                </div>
                <div className="absolute -right-2 -top-2 rounded-full bg-background p-1">
                  {isPassing ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                  )}
                </div>
              </div>

              <h3 className="mt-4 text-xl font-semibold">{isPassing ? "Congratulations!" : "Good effort!"}</h3>

              <p className="mt-2 text-center text-muted-foreground">
                {isPassing
                  ? "You've passed the quiz with a great score!"
                  : "You've completed the quiz. Keep practicing to improve your score!"}
              </p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {score} / {quiz.questions.length} correct
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">{formatTime(timeElapsed)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Review</h3>

              {quiz.questions.map((question, index) => {
                const selectedAnswerId = selectedAnswers[question.id]
                const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId)
                const correctAnswer = question.answers.find((a) => a.isCorrect)
                const isCorrect = selectedAnswer?.isCorrect

                return (
                  <div key={question.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">Question {index + 1}</div>
                      {isCorrect ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Correct
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="mr-1 h-4 w-4" />
                          Incorrect
                        </div>
                      )}
                    </div>

                    <p className="mt-2">{question.text}</p>

                    <div className="mt-3 space-y-2">
                      {question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className={`rounded-md border p-3 transition-colors ${getAnswerStatusClass(question, answer.id)}`}
                        >
                          {answer.text}
                          {answer.isCorrect && <span className="ml-2 text-xs text-green-600">(Correct Answer)</span>}
                        </div>
                      ))}
                    </div>

                    {question.explanation && (
                      <div className="mt-3 rounded-md bg-muted p-4 text-sm">
                        <div className="font-medium">Explanation:</div>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button variant="outline" asChild>
              <a href="/mock-quizzes">Back to Quizzes</a>
            </Button>
            <Button asChild>
              <a href={`/mock-quizzes/${params.id}`}>Retake Quiz</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Debug panel to show fetched questions */}
      <DebugPanel />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Time remaining: {formatTime(timeRemaining)}
          </div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="mt-2" />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card className="overflow-hidden">
            <div
              className={`h-1 w-full ${flaggedQuestions.has(currentQuestionIndex) ? "bg-yellow-500" : "bg-primary"}`}
            ></div>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Question {currentQuestionIndex + 1}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                    className={flaggedQuestions.has(currentQuestionIndex) ? "text-yellow-500" : ""}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <p className="mt-2 text-lg">{currentQuestion.text}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.answers.length > 0 ? (
                    currentQuestion.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className={`flex cursor-pointer items-center space-x-2 rounded-md border p-4 transition-all hover:bg-muted/50 ${
                          selectedAnswers[currentQuestion.id] === answer.id ? "border-primary bg-primary/5" : ""
                        } ${getAnswerStatusClass(currentQuestion, answer.id)}`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                      >
                        <RadioGroupItem value={answer.id} id={answer.id} />
                        <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                          {answer.text}
                        </Label>
                        {showAnswer && answer.isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-200">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        <p className="font-medium">No answer options available</p>
                      </div>
                      <p className="mt-2 text-sm">
                        This question doesn't have any answer options. Please try refreshing or contact support.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => fetchQuestionsWithAnswers(params.id)}
                      >
                        Retry Fetching Answers
                      </Button>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {showAnswer && currentQuestion.explanation && (
                <div className="mt-6 rounded-md bg-muted p-4 text-sm">
                  <h4 className="font-medium">Explanation:</h4>
                  <p className="mt-1">{currentQuestion.explanation}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {!showAnswer && selectedAnswers[currentQuestion.id] && (
                  <Button variant="secondary" onClick={handleRevealAnswer}>
                    Show Answer
                  </Button>
                )}
              </div>

              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  variant={showConfirmSubmit ? "destructive" : "default"}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
                      Submitting...
                    </>
                  ) : showConfirmSubmit ? (
                    "Confirm Submit"
                  ) : (
                    "Submit Quiz"
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Quiz Navigation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions.map((_, index) => {
                  const isAnswered = !!selectedAnswers[quiz.questions[index].id]
                  const isFlagged = flaggedQuestions.has(index)
                  const isCurrent = currentQuestionIndex === index

                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={`h-10 w-10 p-0 ${
                        isCurrent ? "border-primary bg-primary/10" : ""
                      } ${isAnswered ? "bg-muted" : ""} ${isFlagged ? "border-yellow-500" : ""}`}
                      onClick={() => handleJumpToQuestion(index)}
                    >
                      {isAnswered ? (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      ) : isFlagged ? (
                        <Flag className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </Button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm border">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-yellow-500">
                    <Flag className="h-3 w-3 text-yellow-500" />
                  </div>
                  <span>Flagged for review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm border">
                    <span className="text-xs">1</span>
                  </div>
                  <span>Unanswered</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {Object.keys(selectedAnswers).length} of {quiz.questions.length} questions answered
                </p>
                <Progress
                  value={(Object.keys(selectedAnswers).length / quiz.questions.length) * 100}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
