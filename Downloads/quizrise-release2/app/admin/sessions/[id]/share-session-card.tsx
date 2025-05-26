"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Check, Copy, Share2 } from "lucide-react"

interface ShareSessionCardProps {
  session: any
}

export function ShareSessionCard({ session }: ShareSessionCardProps) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const joinUrl = `${baseUrl}/sessions/join?code=${session.access_code}`

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "The link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      })
    }
  }

  function shareSession() {
    if (navigator.share) {
      navigator
        .share({
          title: `Join Quiz: ${session.title}`,
          text: `Join my quiz session: ${session.title}`,
          url: joinUrl,
        })
        .catch((error) => console.log("Error sharing:", error))
    } else {
      copyToClipboard(joinUrl)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Session</CardTitle>
        <CardDescription>Share this session with participants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Access Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 text-lg font-bold tracking-widest">{session.access_code}</code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(session.access_code)}
              title="Copy access code"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Share Link</p>
          <div className="flex items-center gap-2">
            <Input value={joinUrl} readOnly className="font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(joinUrl)} title="Copy join link">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={shareSession} className="w-full">
          <Share2 className="mr-2 h-4 w-4" />
          Share Session
        </Button>
      </CardFooter>
    </Card>
  )
}
