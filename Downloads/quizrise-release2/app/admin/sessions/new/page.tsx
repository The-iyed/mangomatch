"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Generate a random access code
function generateAccessCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar looking characters
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export default function NewSessionPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [quizId, setQuizId] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("30")
  const [accessCode, setAccessCode] = useState(generateAccessCode())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { isAuthenticated, isAdmin, user } = useAuth()

  // Check authentication and fetch quizzes
  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isAuthenticated) {
      router.push("/login?redirect=/admin/sessions/new")
      return
    }

    if (!isAdmin) {
      router.push("/")
      return
    }

    async function fetchQuizzes() {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("id, title, category_id, questions(count)")
          .order("created_at", { ascending: false })

        if (error) throw error

        setQuizzes(data || [])
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        toast({
          title: "Error",
          description: "Failed to load quizzes. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchQuizzes()
  }, [supabase, toast, router, isAuthenticated, isAdmin])

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        throw new Error("You must be logged in to create a session")
      }

      // Validate inputs
      if (!title || !quizId || !durationMinutes) {
        throw new Error("Please fill in all required fields")
      }

      // Create session
      const { data, error } = await supabase
        .from("quiz_sessions")
        .insert({
          quiz_id: quizId,
          admin_id: user.id,
          title,
          description,
          duration_minutes: Number.parseInt(durationMinutes),
          access_code: accessCode,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Session created successfully!",
      })

      // Redirect to session details
      router.push(`/admin/sessions/${data.id}`)
    } catch (error: any) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create session. Please try again.",
        variant: "destructive",
      })

      // If authentication error, redirect to login
      if (error.message?.includes("logged in") || error.message?.includes("authenticated")) {
        router.push("/login?redirect=/admin/sessions/new")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate a new access code
  function handleGenerateNewCode() {
    setAccessCode(generateAccessCode())
  }

  // Show loading state while checking authentication
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Checking authentication...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state while fetching quizzes
  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading quizzes...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Session</CardTitle>
          <CardDescription>Create a timed quiz session for participants to join</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this session"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this session"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizId">Select Quiz</Label>
              <Select value={quizId} onValueChange={setQuizId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.length === 0 ? (
                    <SelectItem value="no-quizzes" disabled>
                      No quizzes available
                    </SelectItem>
                  ) : (
                    quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questions?.[0]?.count || 0} questions)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <div className="flex gap-2">
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="font-mono text-center uppercase"
                  maxLength={6}
                  required
                />
                <Button type="button" variant="outline" onClick={handleGenerateNewCode}>
                  Generate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Participants will use this code to join the session</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/sessions")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || quizzes.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
