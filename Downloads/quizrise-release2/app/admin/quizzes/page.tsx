"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Eye, Loader2, Search, Tag } from "lucide-react"
import Link from "next/link"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showTagsFilter, setShowTagsFilter] = useState(false)
  const supabase = getClientSupabaseInstance()
  const { toast } = useToast()

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select(`
          *,
          categories:category_id (name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuizzes(data || [])
    } catch (error) {
      console.error("Error fetching quizzes:", error)
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", deleteId)

      if (error) throw error

      toast({
        title: "Quiz deleted",
        description: "The quiz has been deleted successfully",
      })

      // Refresh quizzes
      fetchQuizzes()
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (!searchQuery) return true
    return (
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (quiz.categories?.name && quiz.categories.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <p className="text-muted-foreground">Here, you can effortlessly list, delete, edit, and create new exams.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild>
          <Link href="/admin/quizzes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create new Quiz
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
              className="w-full pl-8 sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="mr-2">Filter:</span>
                <Tag className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Easy</DropdownMenuItem>
              <DropdownMenuItem>Medium</DropdownMenuItem>
              <DropdownMenuItem>Hard</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredQuizzes.length > 0 ? (
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.description || "No description provided"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Badge variant="outline">{quiz.categories?.name || "Uncategorized"}</Badge>
                      <Badge
                        variant={
                          quiz.difficulty === "easy"
                            ? "outline"
                            : quiz.difficulty === "medium"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {quiz.difficulty}
                      </Badge>
                      <Badge variant="outline">{quiz.source_type}</Badge>
                      <div className="text-xs text-muted-foreground">Total {quiz.question_count || 0} questions</div>
                      <div className="text-xs text-muted-foreground">
                        Last update: {new Date(quiz.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 sm:mt-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/quizzes/${quiz.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteId(quiz.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/quizzes/${quiz.id}/stats`}>View Stats</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h2 className="mb-2 text-xl font-semibold">No Quizzes Found</h2>
            <p className="mb-6 text-center text-muted-foreground">
              {searchQuery
                ? "No quizzes match your search criteria."
                : "You haven't created any quizzes yet. Create your first quiz to get started."}
            </p>
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quiz and all associated questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
