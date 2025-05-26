"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { Loader2, Search, BookOpen, Clock, Award, Tag, Filter, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const supabase = getClientSupabaseInstance()

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true)

        // Fetch categories
        const { data: categoriesData } = await supabase.from("categories").select("*").order("name")

        setCategories(categoriesData || [])

        // Fetch quizzes with categories
        const { data: quizzesData } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories:category_id (id, name),
            questions (count),
            quiz_attempts (count)
          `)
          .order("created_at", { ascending: false })

        // Note: We don't fetch answers here as they're only needed when taking a quiz
        // Answers are fetched in the quiz-taking page (app/(user)/quizzes/[id]/take/page.tsx)

        setQuizzes(quizzesData || [])
      } catch (error) {
        console.error("Error fetching quizzes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizzes()
  }, [])

  // Filter quizzes based on search term and filters
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      searchTerm === "" ||
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || quiz.category_id === categoryFilter

    const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  // Sort quizzes
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "a-z":
        return a.title.localeCompare(b.title)
      case "z-a":
        return b.title.localeCompare(a.title)
      case "most-questions":
        return b.questions.length - a.questions.length
      case "most-taken":
        return b.quiz_attempts.length - a.quiz_attempts.length
      default:
        return 0
    }
  })

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

  // Get difficulty icon
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <Award className="h-4 w-4 text-green-500" />
      case "medium":
        return <Award className="h-4 w-4 text-amber-500" />
      case "hard":
        return <Award className="h-4 w-4 text-red-500" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  // Get estimated time based on question count
  const getEstimatedTime = (questionCount: number) => {
    return Math.ceil(questionCount * 1.5)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Quizzes</h1>
          <p className="text-muted-foreground">Browse and take quizzes on various topics</p>
        </div>
        <Button className="mt-4 sm:mt-0 flex items-center gap-2" asChild>
          <Link href="/sessions/join">
            <Users className="h-4 w-4" />
            Join a Session
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="w-full sm:w-1/3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3">
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by difficulty" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
                <SelectItem value="z-a">Z-A</SelectItem>
                <SelectItem value="most-questions">Most Questions</SelectItem>
                <SelectItem value="most-taken">Most Taken</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {sortedQuizzes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedQuizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden transition-all hover:shadow-md">
              <div
                className={`h-1 w-full ${
                  quiz.difficulty === "easy"
                    ? "bg-green-500"
                    : quiz.difficulty === "medium"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              ></div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                  <Badge variant={getDifficultyVariant(quiz.difficulty)} className="flex items-center gap-1">
                    {getDifficultyIcon(quiz.difficulty)}
                    {quiz.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {quiz.description || "No description provided"}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline">{quiz.categories?.name || "Uncategorized"}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {quiz.questions.length || 0}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getEstimatedTime(quiz.questions.length || 0)} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Created {formatDate(quiz.created_at)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 p-4">
                <Button asChild className="w-full">
                  <Link href={`/quizzes/${quiz.id}`}>View Quiz</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">No Quizzes Found</h2>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== "all" || difficultyFilter !== "all"
              ? "Try adjusting your search or filters to find more quizzes."
              : "There are no quizzes available at the moment. Check back later!"}
          </p>
        </div>
      )}
    </div>
  )
}
