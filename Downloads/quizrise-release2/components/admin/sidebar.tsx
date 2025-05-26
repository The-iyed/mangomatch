"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, FileQuestion, FolderKanban, LayoutDashboard, LogOut, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AdminSidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-64 border-r bg-card", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xl font-semibold tracking-tight">QuizRise Admin</h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/admin" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/admin/quizzes") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/quizzes">
                <FileQuestion className="mr-2 h-4 w-4" />
                Quizzes
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/admin/categories") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/categories">
                <FolderKanban className="mr-2 h-4 w-4" />
                Categories
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/admin/sessions") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/sessions">
                <Clock className="mr-2 h-4 w-4" />
                Sessions
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/admin/users") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start mt-4" asChild>
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
