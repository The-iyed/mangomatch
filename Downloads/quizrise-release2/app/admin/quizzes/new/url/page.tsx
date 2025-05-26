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
import { Brain, Globe, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateUrlQuizPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [url, setUrl] = useState("")
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

  useEffect(() => {
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
        toast({
          title: "Error",
          description: error.message || "An error occurred while fetching data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch (e) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!title) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Missing category",
        description: "Please select a category for your quiz",
        variant: "destructive",
      })
      return
    }

    if (!difficulty) {
      toast({
        title: "Missing difficulty",
        description: "Please select a difficulty level for your quiz",
        variant: "destructive",
      })
      return
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      setGenerationStep("Creating quiz in database...")
      setGenerationProgress(10)

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title,
          description,
          category_id: category,
          difficulty,
          source_type: "url",
          source_content: url,
          created_by: user?.id,
        })
        .select()
        .single()

      if (quizError) {
        throw new Error(`Error creating quiz: ${quizError.message}`)
      }

      setGenerationStep("Fetching content from URL...")
      setGenerationProgress(30)

      // Generate quiz questions from URL using our API endpoint
      const response = await fetch("/api/generate-quiz-from-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quiz.id,
          url,
          numQuestions,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
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
      setError(error.message || "An error occurred while creating the quiz")
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
      setGenerationProgress(0)
    } finally {
      setIsGenerating(false)
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
                <li>Fetching content from the provided URL</li>
                <li>Analyzing the web content with AI</li>
                <li>Generating quiz questions and answers</li>
                <li>Saving everything to the database</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                This process may take a minute or two depending on the website content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If there was an error, show an error message
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Error Creating Quiz</h1>
          <p className="text-muted-foreground">There was an error creating your quiz</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={() => setError(null)}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Quiz from URL</h1>
        <p className="text-muted-foreground">Enter a website URL to generate quiz questions</p>
      </div>

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
              <Label htmlFor="url">Website URL</Label>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a valid URL including the http:// or https:// prefix. The content must be publicly accessible.
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
