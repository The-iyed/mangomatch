import { NextResponse } from "next/server"

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  try {
    // Handle different YouTube URL formats
    let id = null

    // Regular YouTube URL
    if (url.includes("youtube.com/watch?v=")) {
      const urlObj = new URL(url)
      id = urlObj.searchParams.get("v")
    }
    // Shortened youtu.be URL
    else if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/")
      if (parts.length > 1) {
        id = parts[1].split("?")[0]
      }
    }
    // YouTube embed URL
    else if (url.includes("youtube.com/embed/")) {
      const parts = url.split("youtube.com/embed/")
      if (parts.length > 1) {
        id = parts[1].split("?")[0]
      }
    }

    return id
  } catch (error) {
    return null
  }
}

// Fetch YouTube video metadata using oEmbed
async function fetchYouTubeInfo(videoId: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch video info: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      title: data.title,
      author: data.author_name,
      thumbnailUrl: data.thumbnail_url,
      success: true,
    }
  } catch (error: any) {
    console.error("Error fetching YouTube info:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function POST(request: Request) {
  try {
    const { youtubeUrl } = await request.json()

    if (!youtubeUrl) {
      return NextResponse.json({ success: false, error: "YouTube URL is required" }, { status: 400 })
    }

    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ success: false, error: "Invalid YouTube URL" }, { status: 400 })
    }

    // Fetch video info
    const videoInfo = await fetchYouTubeInfo(videoId)

    return NextResponse.json({
      ...videoInfo,
      videoId,
    })
  } catch (error: any) {
    console.error("Error in YouTube info API:", error)
    return NextResponse.json({ success: false, error: error.message || "An error occurred" }, { status: 500 })
  }
}
