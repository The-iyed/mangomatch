"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, ArrowLeft, Loader2, FileText, AlertTriangle, FileType, Youtube, Globe } from "lucide-react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function QuizDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Check if the ID is "new" and redirect to the correct page
  useEffect(() => {
    if (params.id === "new") {
      router.push("/admin/quizzes/new")
      return
    }
  }, [params.id, router])

  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const supabase = getClientSupabaseInstance()

  // Modify the fetchQuizData function to add a check for the "new" ID
  useEffect(() => {
    const fetchQuizData = async () => {
      // Skip fetching if the ID is "new"
      if (params.id === "new") {
        setIsLoading(false)
        return
      }

      try {
        // Fetch quiz details
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

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", params.id)
          .order("order_num", { ascending: true })

        if (questionsError) throw questionsError

        if (!questionsData || questionsData.length === 0) {
          setQuestions([])
          return
        }

        // Fetch all answers for this quiz's questions
        const questionIds = questionsData.map((q) => q.id)

        const { data: answersData, error: answersError } = await supabase
          .from("answers")
          .select("*")
          .in("question_id", questionIds)

        if (answersError) throw answersError

        // Combine questions with their answers
        const questionsWithAnswers = questionsData.map((question) => {
          const questionAnswers = answersData ? answersData.filter((answer) => answer.question_id === question.id) : []

          return {
            ...question,
            answers: questionAnswers,
          }
        })

        setQuestions(questionsWithAnswers || [])

        // Log the fetched data for debugging
        console.log("Fetched questions with answers:", questionsWithAnswers)

        // Check if answers are present
        const questionsWithoutAnswers = questionsWithAnswers.filter((q) => !q.answers || q.answers.length === 0)
        if (questionsWithoutAnswers.length > 0) {
          console.warn(
            `${questionsWithoutAnswers.length} questions are missing answers:`,
            questionsWithoutAnswers.map((q) => q.id),
          )
        }
      } catch (error: any) {
        console.error("Error fetching quiz data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load quiz data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizData()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      // Delete the quiz
      const { error } = await supabase.from("quizzes").delete().eq("id", params.id)

      if (error) throw error

      toast({
        title: "Quiz deleted",
        description: "The quiz has been deleted successfully",
      })

      router.push("/admin/quizzes")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create a New Quiz</h1>
          <p className="text-muted-foreground">Select a method to create your quiz:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Link href="/admin/quizzes/new/text" className="block">
            <div className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-lg mb-2">Text</h3>
              <p className="text-muted-foreground text-sm">Create a quiz from text content you provide.</p>
            </div>
          </Link>

          <Link href="/admin/quizzes/new/pdf" className="block">
            <div className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                <FileType className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-lg mb-2">PDF</h3>
              <p className="text-muted-foreground text-sm">Generate a quiz from a PDF document.</p>
            </div>
          </Link>

          <Link href="/admin/quizzes/new/youtube" className="block">
            <div className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                <Youtube className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-lg mb-2">YouTube</h3>
              <p className="text-muted-foreground text-sm">Create a quiz from a YouTube video.</p>
            </div>
          </Link>

          <Link href="/admin/quizzes/new/url" className="block">
            <div className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-lg mb-2">URL</h3>
              <p className="text-muted-foreground text-sm">Generate a quiz from web content.</p>
            </div>
          </Link>
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="outline" asChild>
            <Link href="/admin/quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/admin/quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{quiz.categories?.name || "Uncategorized"}</Badge>
            <Badge
              variant={quiz.difficulty === "easy" ? "outline" : quiz.difficulty === "medium" ? "secondary" : "default"}
            >
              {quiz.difficulty}
            </Badge>
            <Badge variant="outline">{quiz.source_type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/quizzes/${params.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Quiz
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Quiz
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Description</h3>
            <p className="text-muted-foreground">{quiz.description || "No description provided"}</p>
          </div>

          {quiz.source_type === "pdf" && quiz.source_content && (
            <div>
              <h3 className="font-medium">Source PDF</h3>
              <div className="mt-2 flex items-center gap-2 rounded-md border p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <a
                  href={quiz.source_content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View PDF
                </a>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium">Questions ({questions.length})</h3>
            {questions.length > 0 ? (
              <div className="mt-4 space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Question {index + 1}</h4>
                    </div>
                    <p className="mt-2">{question.question_text}</p>

                    <div className="mt-4 space-y-2">
                      <h5 className="text-sm font-medium flex items-center">
                        <span>Answer Options</span>
                        {quiz.source_type === "pdf" ||
                        quiz.source_type === "youtube" ||
                        quiz.source_type === "text" ||
                        quiz.source_type === "url" ? (
                          <Badge
                            variant="outline"
                            className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            AI Generated
                          </Badge>
                        ) : null}
                      </h5>
                      {question.answers && question.answers.length > 0 ? (
                        question.answers.map((answer: any) => (
                          <div
                            key={answer.id}
                            className={`rounded-md p-2 ${
                              answer.is_correct ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{answer.answer_text}</span>
                              {answer.is_correct && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                >
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-200">
                          <div className="flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            <p className="font-medium">No answer options available</p>
                          </div>
                          <p className="mt-2 text-sm">
                            This question doesn't have any answer options. Please check the database connection or try
                            refreshing the page.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={async () => {
                              try {
                                // Fetch answers directly for this question
                                const { data, error } = await supabase
                                  .from("answers")
                                  .select("*")
                                  .eq("question_id", question.id)

                                if (error) throw error

                                if (data && data.length > 0) {
                                  // Update the question with the fetched answers
                                  setQuestions((prevQuestions) =>
                                    prevQuestions.map((q) => (q.id === question.id ? { ...q, answers: data } : q)),
                                  )

                                  toast({
                                    title: "Success",
                                    description: `Found ${data.length} answers for this question`,
                                  })
                                } else {
                                  toast({
                                    title: "No answers found",
                                    description: "No answers were found for this question in the database",
                                    variant: "destructive",
                                  })
                                }
                              } catch (err: any) {
                                console.error("Error fetching answers:", err)
                                toast({
                                  title: "Error",
                                  description: err.message || "Failed to fetch answers",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            Fetch Answers
                          </Button>
                        </div>
                      )}
                    </div>

                    {question.explanation && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium">Explanation</h5>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-md bg-muted p-4 text-center">
                <p>No questions have been created for this quiz yet.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" asChild>
            <Link href="/admin/quizzes">Back to Quizzes</Link>
          </Button>
          <Button asChild>
            <Link href={`/quizzes/${params.id}`}>Preview Quiz</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
