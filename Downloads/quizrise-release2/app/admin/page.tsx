"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, FolderKanban, BarChart3, Loader2, Plus } from "lucide-react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([])
  const supabase = getClientSupabaseInstance()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counts
        const [quizCountResult, userCountResult, categoryCountResult, attemptCountResult] = await Promise.all([
          supabase.from("quizzes").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("categories").select("*", { count: "exact", head: true }),
          supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
        ])

        const quizCount = quizCountResult.count || 0
        const userCount = userCountResult.count || 0
        const categoryCount = categoryCountResult.count || 0
        const attemptCount = attemptCountResult.count || 0

        setStats([
          {
            title: "Total Quizzes",
            value: quizCount,
            description: "Quizzes created",
            icon: BookOpen,
          },
          {
            title: "Total Users",
            value: userCount,
            description: "Registered users",
            icon: Users,
          },
          {
            title: "Categories",
            value: categoryCount,
            description: "Quiz categories",
            icon: FolderKanban,
          },
          {
            title: "Quiz Attempts",
            value: attemptCount,
            description: "Total attempts",
            icon: BarChart3,
          },
        ])

        // Fetch recent quizzes
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories:category_id (name)
          `)
          .order("created_at", { ascending: false })
          .limit(5)

        setRecentQuizzes(quizzes || [])
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the QuizRise admin panel</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Latest quizzes created in the system</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/admin/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{quiz.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {quiz.categories?.name || "Uncategorized"} • {quiz.difficulty}
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/quizzes/${quiz.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                No quizzes created yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create new quiz
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/categories/new">
                <FolderKanban className="mr-2 h-4 w-4" />
                Add new category
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage users
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
