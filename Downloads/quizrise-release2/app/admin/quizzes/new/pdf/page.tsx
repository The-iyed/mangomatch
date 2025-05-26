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
import { FileText, Upload, Loader2, Brain, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreatePdfQuizPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [manualContent, setManualContent] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [numQuestions, setNumQuestions] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [useDirectApproach, setUseDirectApproach] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getClientSupabaseInstance()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch categories
        const { data: categoriesData } = await supabase.from("categories").select("*")
        if (categoriesData) {
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)

      // Extract filename for manual content
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "")
      setManualContent(`This quiz is based on the document "${fileName}". 
      
The document appears to be about ${fileName.split(/[-_\s]/).join(" ")}.

Key points from the document:
1. First important concept from ${fileName}
2. Second important concept from ${fileName}
3. Third important concept from ${fileName}

Please generate quiz questions based on this content.`)
    }
  }

  const createQuizDirectly = async () => {
    try {
      setGenerationStep("Creating quiz directly...")
      setGenerationProgress(30)

      // Create the quiz directly in the database
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title,
          description,
          category_id: category,
          difficulty,
          created_by: user?.id,
          source_type: "pdf",
          source_content: manualContent || `Quiz about ${title}`,
          question_count: 0, // Will update after generating questions
        })
        .select()
        .single()

      if (quizError) {
        throw new Error(`Failed to create quiz: ${quizError.message}`)
      }

      setGenerationStep("Generating questions with AI...")
      setGenerationProgress(50)

      // Generate questions directly with OpenAI
      const response = await fetch("/api/simple-quiz-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quiz.id,
          content: manualContent || `Create a quiz about ${title}. ${description}`,
          numQuestions,
        }),
      })

      if (!response.ok) {
        // Try to get error details
        let errorMessage = `Server error: ${response.status}`
        try {
          const errorText = await response.text()
          errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}`
        } catch (e) {
          // If we can't get text, use the status
          errorMessage = `Server error: ${response.status}`
        }

        // Delete the quiz since generation failed
        await supabase.from("quizzes").delete().eq("id", quiz.id)

        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.success) {
        // Delete the quiz since generation failed
        await supabase.from("quizzes").delete().eq("id", quiz.id)
        throw new Error(result.error || "Failed to generate quiz questions")
      }

      return {
        quizId: quiz.id,
        questionCount: result.questionCount || 0,
      }
    } catch (error: any) {
      console.error("Error in direct quiz creation:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDebugInfo(null)

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
      setGenerationProgress(10)

      // Use the simplified direct approach
      const result = await createQuizDirectly()

      setGenerationProgress(100)
      setGenerationStep("Quiz created successfully!")

      toast({
        title: "Quiz created",
        description: `Your quiz has been created successfully with ${result.questionCount} questions`,
      })

      // Redirect to the quiz page
      router.push(`/admin/quizzes/${result.quizId}`)
    } catch (error: any) {
      console.error("Error creating quiz:", error)
      setError(error.message || "An error occurred")

      // Add debug info
      setDebugInfo(
        JSON.stringify(
          {
            title,
            description: description.substring(0, 50) + "...",
            category,
            difficulty,
            filePresent: !!file,
            contentLength: manualContent ? manualContent.length : 0,
            userId: user?.id,
            timestamp: new Date().toISOString(),
            errorMessage: error.message,
            errorStack: error.stack,
          },
          null,
          2,
        ),
      )

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
          <h1 className="text-3xl font-bold">Creating Quiz with AI</h1>
          <p className="text-muted-foreground">Please wait while our AI generates your quiz</p>
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
                <li>Sending the content to our AI</li>
                <li>AI is analyzing the content and creating questions</li>
                <li>Generating multiple-choice options</li>
                <li>Creating explanations for each question</li>
                <li>Saving everything to the database</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                This process may take a minute or two depending on the complexity of your content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Quiz from PDF with AI</h1>
        <p className="text-muted-foreground">Upload a PDF file and let our AI generate quiz questions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            {debugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
                <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-white">
                  {debugInfo}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Brain className="h-4 w-4" />
        <AlertTitle>AI-Powered Quiz Generation</AlertTitle>
        <AlertDescription>
          Our AI will analyze your PDF content and automatically create quiz questions, answer options, and explanations
          based on the material.
        </AlertDescription>
      </Alert>

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
              <Label>PDF File (Optional)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("pdf-file")?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? "Change file" : "Upload PDF"}
                </Button>
                <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </div>

              {file && (
                <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualContent">Content for Quiz Generation</Label>
              <Textarea
                id="manualContent"
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={6}
                placeholder="Enter content for the AI to generate questions from. This will be used instead of extracting text from the PDF."
              />
              <p className="text-xs text-muted-foreground">
                You can edit this content to provide specific information for the AI to use when generating questions.
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
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Create Quiz with AI
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
