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
import { Brain, Youtube, Loader2, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateYoutubeQuizPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false)
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

  // Extract YouTube video ID and fetch info when URL changes
  useEffect(() => {
    const fetchVideoInfo = async () => {
      if (!youtubeUrl) {
        setVideoId(null)
        setVideoInfo(null)
        return
      }

      try {
        setIsLoadingVideo(true)
        setTranscript(null)
        setError(null)

        // Call our API to get video info
        const response = await fetch("/api/youtube-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ youtubeUrl }),
        })

        const data = await response.json()

        if (data.success) {
          setVideoId(data.videoId)
          setVideoInfo(data)

          // Auto-fill title and description if they're empty
          if (!title) {
            setTitle(`Quiz on: ${data.title}`)
          }
          if (!description) {
            setDescription(`Quiz based on the YouTube video: ${data.title} by ${data.author}`)
          }
        } else {
          setVideoId(null)
          setVideoInfo(null)
          toast({
            title: "Error",
            description: data.error || "Failed to get video information",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error fetching video info:", error)
        setVideoId(null)
        setVideoInfo(null)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoadingVideo(false)
      }
    }

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(() => {
      if (youtubeUrl) {
        fetchVideoInfo()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [youtubeUrl])

  const fetchTranscript = async () => {
    if (!videoId) return

    setIsLoadingTranscript(true)
    setError(null)

    try {
      // Call our API to get transcript
      const response = await fetch("/api/youtube-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl }),
      })

      const data = await response.json()

      if (data.success) {
        setTranscript(data.transcript)
        toast({
          title: "Transcript loaded",
          description: "Video transcript has been successfully loaded",
        })
      } else {
        setError(data.error || "Failed to get video transcript")
        toast({
          title: "Error",
          description: data.error || "Failed to get video transcript",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching transcript:", error)
      setError(error.message || "An error occurred")
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTranscript(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!videoId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube video URL",
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
      setGenerationStep("Creating quiz...")
      setGenerationProgress(20)

      // Call the unified API endpoint
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          categoryId: category,
          difficulty,
          userId: user?.id,
          sourceType: "youtube",
          youtubeUrl,
          transcript,
          numQuestions,
        }),
      })

      setGenerationProgress(40)
      setGenerationStep("Analyzing content with AI...")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to generate quiz")
      }

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
  if (isGenerating && !error) {
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
                <li>Processing the video transcript</li>
                <li>Analyzing the content with AI</li>
                <li>Generating quiz questions and answers</li>
                <li>Saving everything to the database</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                This process may take a minute or two depending on the video length and complexity.
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
        <h1 className="text-3xl font-bold">Create Quiz from YouTube</h1>
        <p className="text-muted-foreground">Enter a YouTube video URL to generate quiz questions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Brain className="h-4 w-4" />
        <AlertTitle>AI-Powered Quiz Generation</AlertTitle>
        <AlertDescription>
          Our AI will analyze the YouTube video transcript and automatically create quiz questions, answer options, and
          explanations based on the content.
        </AlertDescription>
      </Alert>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube Video URL</Label>
              <div className="flex items-center space-x-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  disabled={isLoadingVideo}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a valid YouTube video URL. The video should have captions available for best results.
              </p>
            </div>

            {isLoadingVideo && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading video information...</span>
              </div>
            )}

            {videoId && videoInfo && (
              <div className="rounded-md border p-4">
                <h3 className="mb-2 text-sm font-medium">Video Preview</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="aspect-video overflow-hidden rounded-md">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div>
                    <h4 className="font-medium">{videoInfo.title}</h4>
                    <p className="text-sm text-muted-foreground">By {videoInfo.author}</p>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchTranscript}
                        disabled={isLoadingTranscript}
                      >
                        {isLoadingTranscript ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading Transcript...
                          </>
                        ) : transcript ? (
                          "Transcript Loaded ✓"
                        ) : (
                          "Load Transcript"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {transcript && (
                  <div className="mt-4">
                    <h4 className="mb-1 text-sm font-medium">Transcript Preview</h4>
                    <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">
                        {transcript.substring(0, 500)}
                        {transcript.length > 500 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                )}

                {!transcript && !isLoadingTranscript && (
                  <Alert
                    variant="warning"
                    className="mt-4 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                  >
                    <Info className="h-4 w-4" />
                    <AlertTitle>Transcript recommended</AlertTitle>
                    <AlertDescription>
                      Loading the transcript is recommended for better quiz generation. Without a transcript, the quiz
                      will be based on general information about the video.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

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
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isGenerating || !videoId || isLoadingVideo || isLoadingTranscript}
              className="ml-auto"
            >
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
