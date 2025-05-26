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
    console.error("Error extracting YouTube video ID:", error)
    return null
  }
}

// Fetch YouTube transcript using a third-party API
async function fetchTranscriptFromAPI(videoId: string): Promise<string> {
  try {
    // Try multiple transcript APIs for better reliability
    const apis = [
      // First API option
      async () => {
        const response = await fetch(`https://youtubetranscript.com/?server_vid=${videoId}`)

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        // Check content type to handle different response formats
        const contentType = response.headers.get("content-type") || ""

        if (contentType.includes("application/json")) {
          const data = await response.json()
          if (!data.transcript) {
            throw new Error("No transcript found in API response")
          }
          return data.transcript.text
        } else {
          // If not JSON, try to extract text from the response
          const text = await response.text()
          throw new Error("API returned non-JSON response")
        }
      },

      // Second API option - using a different service
      async () => {
        const response = await fetch(`https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`)

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        if (!data.transcript) {
          throw new Error("No transcript found in API response")
        }

        return data.transcript
      },

      // Third option - fallback to video metadata
      async () => {
        const title = await getVideoTitle(videoId)
        return `This is a transcript placeholder for the video titled "${title}". The actual transcript could not be retrieved.`
      },
    ]

    // Try each API in sequence until one works
    for (let i = 0; i < apis.length; i++) {
      try {
        return await apis[i]()
      } catch (error) {
        console.log(`API attempt ${i + 1} failed:`, error)
        // If this is the last API, throw the error
        if (i === apis.length - 1) {
          throw error
        }
        // Otherwise try the next API
      }
    }

    throw new Error("All transcript APIs failed")
  } catch (error: any) {
    console.error("Error fetching from transcript API:", error)
    throw new Error(`Failed to fetch transcript from API: ${error.message}`)
  }
}

// Fallback method to get video title when transcript isn't available
async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )

    if (!response.ok) {
      return `YouTube Video (${videoId})`
    }

    const data = await response.json()
    return data.title || `YouTube Video (${videoId})`
  } catch (error) {
    return `YouTube Video (${videoId})`
  }
}

// Fallback method to generate content from video metadata
async function generateFallbackContent(videoId: string): Promise<string> {
  try {
    const title = await getVideoTitle(videoId)
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Get video metadata from YouTube's oEmbed endpoint
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`)

    let author = "Unknown creator"
    if (response.ok) {
      const data = await response.json()
      author = data.author_name || author
    }

    return `This is a quiz about the YouTube video titled "${title}" by ${author} (ID: ${videoId}). 
    The transcript could not be retrieved automatically. The quiz will be based on the video title, 
    creator information, and general knowledge about the topic. For better results, consider using 
    a video that has captions available or manually providing content about the video.`
  } catch (error) {
    return `This is a quiz about a YouTube video (ID: ${videoId}). The transcript and metadata 
    could not be retrieved automatically.`
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

    // Try to fetch the transcript
    try {
      // Try the API method
      const transcript = await fetchTranscriptFromAPI(videoId)
      return NextResponse.json({ success: true, transcript, videoId })
    } catch (apiError) {
      console.log("Transcript fetch failed:", apiError)

      // Get video title for fallback content
      const fallbackContent = await generateFallbackContent(videoId)
      const videoTitle = await getVideoTitle(videoId)

      // Return fallback content
      return NextResponse.json(
        {
          success: false,
          error: "Could not retrieve transcript. The video might not have captions available.",
          videoId,
          videoTitle,
          fallbackContent,
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    console.error("Error in YouTube transcript API:", error)
    return NextResponse.json({ success: false, error: error.message || "An error occurred" }, { status: 500 })
  }
}
