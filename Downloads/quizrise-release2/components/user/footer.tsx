import { BrainCircuit } from "lucide-react"
import Link from "next/link"

export function UserFooter() {
  return (
    <footer className="border-t bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">QuizRise</span>
          </div>

          <nav className="flex gap-6">
            <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/quizzes" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Quizzes
            </Link>
            <Link href="/categories" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Categories
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              About
            </Link>
          </nav>

          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} QuizRise. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
