"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Brain, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateTextQuizPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [numQuestions, setNumQuestions] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getClientSupabaseInstance()
  const { user } = useAuth()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("*")

      if (categoriesError) {
        throw new Error(`Error fetching categories: ${categoriesError.message}`)
      }

      if (categoriesData) {
        setCategories(categoriesData)
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a quiz. Please log in and try again.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!content || content.trim().length < 50) {
      toast({
        title: "Content too short",
        description: "Please provide more text content to generate meaningful questions",
        variant: "destructive",
      })
      return
    }

    if (!title || !category || !difficulty) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      setGenerationStep("Creating quiz in database...")
      setGenerationProgress(10)

      // Get auth token for API request
      const { data: authData } = await supabase.auth.getSession()
      const token = authData.session?.access_token

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title,
          description,
          category_id: category,
          difficulty,
          source_type: "text",
          source_content: content,
          created_by: user.id,
        })
        .select()
        .single()

      if (quizError) {
        throw new Error(`Error creating quiz: ${quizError.message}`)
      }

      setGenerationStep("Analyzing text content...")
      setGenerationProgress(30)

      // Generate quiz questions from text
      setGenerationStep("Generating questions with AI...")
      setGenerationProgress(50)

      // Call the API to generate questions with auth token
      const response = await fetch("/api/generate-quiz-from-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include JWT token
        },
        body: JSON.stringify({
          quizId: quiz.id,
          textContent: content,
          numQuestions: numQuestions,
          categoryId: category,
          difficulty: difficulty,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to generate quiz questions")
      }

      setGenerationProgress(100)
      setGenerationStep("Quiz created successfully!")

      toast({
        title: "Quiz created",
        description: `Your quiz has been created successfully with ${result.questionCount} questions`,
      })

      // Redirect to the quiz edit page
      router.push(`/admin/quizzes/${quiz.id}`)
    } catch (error: any) {
      console.error("Error creating quiz:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
      setGenerationProgress(0)
    } finally {
      if (error) {
        setIsGenerating(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If we're generating the quiz, show a progress indicator
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creating Quiz</h1>
          <p className="text-muted-foreground">Please wait while we generate your quiz</p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <div className="mt-4">
              <Button variant="outline" onClick={() => setIsGenerating(false)}>
                Go Back
              </Button>
            </div>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Quiz Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{generationStep}</span>
                  <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>

              <div className="rounded-md bg-muted p-4 text-sm">
                <p className="font-medium">What's happening?</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Creating a new quiz in the database</li>
                  <li>Analyzing your text content with AI</li>
                  <li>Generating quiz questions and answers</li>
                  <li>Saving everything to the database</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  This process may take a minute or two depending on the length and complexity of your text.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Quiz from Text</h1>
        <p className="text-muted-foreground">Enter text content to generate quiz questions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty} required>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Select
                value={numQuestions.toString()}
                onValueChange={(value) => setNumQuestions(Number.parseInt(value))}
              >
                <SelectTrigger id="numQuestions">
                  <SelectValue placeholder="Select number of questions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 questions</SelectItem>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="15">15 questions</SelectItem>
                  <SelectItem value="20">20 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Text Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Paste or type the text content you want to create a quiz from..."
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Provide detailed text content to generate better quiz questions. Minimum 50 characters required.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGenerating} className="ml-auto">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                "Create Quiz"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
