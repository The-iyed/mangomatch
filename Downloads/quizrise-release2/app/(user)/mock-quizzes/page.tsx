"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllMockQuizzes } from "@/lib/mock-data"
import { Clock, Search, BookOpen, Award, Tag } from "lucide-react"
import Link from "next/link"

export default function MockQuizzesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const quizzes = getAllMockQuizzes()

  // Filter quizzes based on search term and difficulty
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      searchTerm === "" ||
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter

    return matchesSearch && matchesDifficulty
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

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Practice Quizzes</h1>
        <p className="text-muted-foreground">Test your knowledge with these practice quizzes</p>
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
        </div>
      </div>

      {filteredQuizzes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
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
                  <Badge variant={getDifficultyVariant(quiz.difficulty)} className="capitalize">
                    {quiz.difficulty}
                  </Badge>
                </div>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {quiz.category}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {quiz.questions.length} questions
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {quiz.timeLimit} min
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 p-4">
                <Button asChild className="w-full">
                  <Link href={`/mock-quizzes/${quiz.id}`}>View Quiz</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">No Quizzes Found</h2>
          <p className="text-muted-foreground">
            {searchTerm || difficultyFilter !== "all"
              ? "Try adjusting your search or filters to find more quizzes."
              : "There are no quizzes available at the moment. Check back later!"}
          </p>
        </div>
      )}
    </div>
  )
}
