"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  Loader2,
  BarChart,
} from "lucide-react"
import confetti from "canvas-confetti"

type Question = {
  id: string
  question_text: string
  explanation: string
  answers: {
    id: string
    answer_text: string
    is_correct: boolean
  }[]
}

export default function TakeQuizPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [timeStarted, setTimeStarted] = useState<Date | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [animateQuestion, setAnimateQuestion] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getClientSupabaseInstance()
  const { user } = useAuth()

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Fetch quiz
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

        // Fetch questions with answers
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select(`
            id,
            question_text,
            explanation,
            order_num,
            quiz_id,
            answers!answers_question_id_fkey (
              id,
              answer_text,
              is_correct,
              question_id
            )
          `)
          .eq("quiz_id", params.id)
          .order("order_num", { ascending: true })

        if (questionsError) {
          console.error("Error fetching questions:", questionsError)
          throw questionsError
        }

        // Check if any questions are missing answers
        const questionsWithoutAnswers = questionsData.filter((q) => !q.answers || q.answers.length === 0)

        // If we have questions missing answers, fetch them directly
        if (questionsWithoutAnswers.length > 0) {
          console.log(`Found ${questionsWithoutAnswers.length} questions without answers, fetching directly...`)

          // Get all question IDs that need answers
          const questionIds = questionsWithoutAnswers.map((q) => q.id)

          // Fetch answers directly for these questions
          const { data: missingAnswers, error: answersError } = await supabase.from("answers").select("*")

          if (!answersError && missingAnswers) {
            // Group answers by question_id
            const answersByQuestion = missingAnswers.reduce((acc, answer) => {
              if (!acc[answer.question_id]) {
                acc[answer.question_id] = []
              }
              acc[answer.question_id].push(answer)
              return acc
            }, {})

            // Add the answers to the questions
            questionsData.forEach((question) => {
              if (!question.answers || question.answers.length === 0) {
                question.answers = answersByQuestion[question.id] || []
              }
            })

            console.log(`Added answers to ${Object.keys(answersByQuestion).length} questions`)
          }
        }

        setQuestions(questionsData)

        // Create quiz attempt
        const { data: attemptData, error: attemptError } = await supabase
          .from("quiz_attempts")
          .insert({
            quiz_id: params.id,
            user_id: user?.id,
            max_score: questionsData.length,
          })
          .select()
          .single()

        if (attemptError) throw attemptError

        setAttemptId(attemptData.id)
        setIsLoading(false)
        setTimeStarted(new Date())
      } catch (error: any) {
        console.error("Error loading quiz:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load quiz",
          variant: "destructive",
        })
        router.push("/quizzes")
      }
    }

    if (user) {
      fetchQuizData()
    }
  }, [params.id, supabase, toast, router, user])

  useEffect(() => {
    const fetchAnswersData = async () => {
      try {
        // This was incorrectly trying to fetch a single answer by quiz ID
        // Instead, we should fetch all answers for the questions in this quiz
        // We don't need this separate fetch since we're already getting answers with questions
        // If we need to debug answers, we can use a different approach
        console.log("Answers are already fetched with questions")
      } catch (error: any) {
        console.error("Error fetching answers:", error)
      }
    }

    fetchAnswersData()
  }, [params.id, supabase, toast, router, user])

  // Timer effect
  useEffect(() => {
    if (!timeStarted || isReviewing) return

    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - timeStarted.getTime()) / 1000)
      setTimeElapsed(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [timeStarted, isReviewing])

  const currentQuestion = questions[currentQuestionIndex]

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
    if (currentQuestionIndex < questions.length - 1) {
      setShowAnswer(false)
      setAnimateQuestion(true)
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setAnimateQuestion(false)
      }, 300)
    }
  }, [currentQuestionIndex, questions.length])

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setShowAnswer(false)
      setAnimateQuestion(true)
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1)
        setAnimateQuestion(false)
      }, 300)
    }
  }

  const handleJumpToQuestion = (index: number) => {
    setShowAnswer(false)
    setAnimateQuestion(true)
    setTimeout(() => {
      setCurrentQuestionIndex(index)
      setAnimateQuestion(false)
    }, 300)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleRevealAnswer = () => {
    setShowAnswer(true)
  }

  const handleSubmit = async () => {
    if (showConfirmSubmit) {
      await submitQuiz()
      setShowConfirmSubmit(false)
    } else {
      setShowConfirmSubmit(true)
    }
  }

  const submitQuiz = async () => {
    setIsSubmitting(true)

    try {
      // Calculate score
      let correctCount = 0
      const answerRecords = []

      for (const question of questions) {
        const selectedAnswerId = selectedAnswers[question.id]
        const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId)
        const isCorrect = selectedAnswer?.is_correct || false

        if (isCorrect) {
          correctCount++
        }

        answerRecords.push({
          attempt_id: attemptId,
          question_id: question.id,
          answer_id: selectedAnswerId,
          is_correct: isCorrect,
        })
      }

      // Save attempt answers
      const { error: answersError } = await supabase.from("attempt_answers").insert(answerRecords)

      if (answersError) throw answersError

      // Update attempt with score
      const { error: updateError } = await supabase
        .from("quiz_attempts")
        .update({
          score: correctCount,
          completed: true,
          completed_at: new Date().toISOString(),
          time_taken: timeElapsed,
        })
        .eq("id", attemptId)

      if (updateError) throw updateError

      setScore(correctCount)
      setIsReviewing(true)

      // Show confetti for good scores
      if (correctCount / questions.length >= 0.7) {
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

  const getAnswerStatusClass = (question: Question, answerId: string) => {
    if (!showAnswer && !isReviewing) return ""

    const isSelected = selectedAnswers[question.id] === answerId
    const isCorrect = question.answers.find((a) => a.id === answerId)?.is_correct

    if (isSelected && isCorrect) return "bg-green-100 border-green-500 dark:bg-green-900/20"
    if (isSelected && !isCorrect) return "bg-red-100 border-red-500 dark:bg-red-900/20"
    if (!isSelected && isCorrect) return "bg-green-50 border-green-300 dark:bg-green-900/10"

    return ""
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

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <h3 className="mt-2 text-lg font-semibold">Question Not Found</h3>
          <p className="mt-2 text-muted-foreground">
            There was a problem loading this question. Please try again or contact support.
          </p>
          <Button className="mt-4" onClick={() => router.push("/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  if (isReviewing && score !== null) {
    const percentage = Math.round((score / questions.length) * 100)
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
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {score} / {questions.length} correct
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">{formatTime(timeElapsed)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <BarChart className="h-5 w-5" />
                Question Review
              </h3>

              {questions.map((question, index) => {
                const selectedAnswerId = selectedAnswers[question.id]
                const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId)
                const correctAnswer = question.answers.find((a) => a.is_correct)
                const isCorrect = selectedAnswer?.is_correct

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

                    <p className="mt-2">{question.question_text}</p>

                    <div className="mt-3 space-y-2">
                      {question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className={`rounded-md border p-3 transition-colors ${getAnswerStatusClass(question, answer.id)}`}
                        >
                          {answer.answer_text}
                          {answer.is_correct && <span className="ml-2 text-xs text-green-600">(Correct Answer)</span>}
                        </div>
                      ))}
                    </div>

                    {question.explanation && (
                      <div className="mt-3 rounded-md bg-muted p-3 text-sm">
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
              <a href="/quizzes">Back to Quizzes</a>
            </Button>
            <Button asChild>
              <a href={`/quizzes/${params.id}`}>Retake Quiz</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{quiz?.title}</h1>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {formatTime(timeElapsed)}
          </div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mt-2" />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card className="overflow-hidden">
            <div
              className={`h-1 w-full ${flaggedQuestions.has(currentQuestionIndex) ? "bg-yellow-500" : "bg-primary"}`}
            ></div>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className={`transition-opacity duration-300 ${animateQuestion ? "opacity-0" : "opacity-100"}`}>
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
                <p className="mt-2 text-lg">{currentQuestion.question_text}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-3 transition-opacity duration-300 ${animateQuestion ? "opacity-0" : "opacity-100"}`}
              >
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.answers && currentQuestion.answers.length > 0 ? (
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
                          {answer.answer_text || "No answer text available"}
                        </Label>
                        {showAnswer && answer.is_correct && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-200">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        <p className="font-medium">Fetching answers...</p>
                      </div>
                      <p className="mt-2 text-sm">
                        Attempting to retrieve answers for this question. Please wait a moment...
                      </p>
                      <div className="mt-3 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/40"
                          onClick={async () => {
                            try {
                              // Fetch answers directly for this question
                              const { data: answers, error } = await supabase
                                .from("answers")
                                .select("*")
                                .eq("question_id", currentQuestion.id)
                              console.log("Fetching answers", answers)
                              if (error) throw error

                              if (answers && answers.length > 0) {
                                // Update the current question with the fetched answers
                                setQuestions((prevQuestions) =>
                                  prevQuestions.map((q) =>
                                    q.id === currentQuestion.id ? { ...q, answers: answers } : q,
                                  ),
                                )
                                toast({
                                  title: "Success",
                                  description: `Found ${answers.length} answers for this question`,
                                })
                              } else {
                                toast({
                                  title: "No answers found",
                                  description: "Could not find any answers for this question in the database",
                                  variant: "destructive",
                                })
                              }
                            } catch (error: any) {
                              console.error("Error fetching answers:", error)
                              toast({
                                title: "Error",
                                description: error.message || "Failed to fetch answers",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          Retry Fetching Answers
                        </Button>
                      </div>
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

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  variant={showConfirmSubmit ? "destructive" : "default"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                {questions.map((_, index) => {
                  const isAnswered = !!selectedAnswers[questions[index].id]
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
                  {Object.keys(selectedAnswers).length} of {questions.length} questions answered
                </p>
                <Progress value={(Object.keys(selectedAnswers).length / questions.length) * 100} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
