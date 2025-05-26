"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileType, LinkIcon, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

type SourceType = "pdf" | "text" | "url" | "youtube"

export default function CreateQuizPage() {
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null)
  const router = useRouter()

  const handleSourceSelect = (source: SourceType) => {
    setSelectedSource(source)
    router.push(`/admin/quizzes/new/${source}`)
  }

  const sources = [
    {
      type: "pdf" as SourceType,
      title: "From PDF",
      description: "Create quiz based on your PDF",
      icon: FileText,
      color:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
    },
    {
      type: "text" as SourceType,
      title: "From Text",
      description: "Create quiz based on your text",
      icon: FileType,
      color:
        "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800",
    },
    {
      type: "url" as SourceType,
      title: "From URL",
      description: "Create quiz based on website URL",
      icon: LinkIcon,
      color:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800",
    },
    {
      type: "youtube" as SourceType,
      title: "From YouTube",
      description: "Create quiz based on YouTube video",
      icon: Youtube,
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Select a Source to Create Questions</h1>
        <p className="text-muted-foreground">Choose how you want to create your quiz</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {sources.map((source) => (
          <Card
            key={source.type}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedSource === source.type && "ring-2 ring-primary",
            )}
            onClick={() => handleSourceSelect(source.type)}
          >
            <CardHeader className={cn("flex flex-row items-center gap-4 pb-2", source.color)}>
              <source.icon className="h-8 w-8" />
              <div>
                <CardTitle>{source.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground">{source.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
