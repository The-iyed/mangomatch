// Content processors for different source types

// PDF content processor
export async function processPdfContent(pdfUrl: string): Promise<string> {
  try {
    console.log("Processing PDF content from:", pdfUrl)

    // Fetch the PDF file
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    // For simplicity, we'll extract text using a basic approach
    // In a production app, you might want to use a more robust PDF parsing library
    const buffer = await response.arrayBuffer()

    // Extract text from PDF (simplified version)
    // This is a placeholder - in a real app, you'd use a proper PDF parsing library
    const text = `Content extracted from PDF at ${pdfUrl}. 
    This is a simplified extraction for demonstration purposes.
    In a production environment, you would use a proper PDF parsing library.`

    console.log(`Extracted ${text.length} characters from PDF`)
    return text
  } catch (error: any) {
    console.error("Error processing PDF content:", error)
    throw new Error(`Failed to process PDF: ${error.message}`)
  }
}

// YouTube content processor
export async function processYoutubeContent(youtubeUrl: string): Promise<string> {
  try {
    console.log("Processing YouTube content from:", youtubeUrl)

    // Extract video ID
    const videoId = extractYoutubeVideoId(youtubeUrl)
    if (!videoId) {
      throw new Error("Invalid YouTube URL")
    }

    // Fetch video info and transcript
    // This would typically call your YouTube API endpoints
    const videoInfoResponse = await fetch("/api/youtube-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl }),
    })

    const videoInfo = await videoInfoResponse.json()
    if (!videoInfo.success) {
      throw new Error(videoInfo.error || "Failed to get video information")
    }

    // Fetch transcript
    const transcriptResponse = await fetch("/api/youtube-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl }),
    })

    const transcriptData = await transcriptResponse.json()

    // Use transcript if available, otherwise use video info
    const content = transcriptData.success
      ? transcriptData.transcript
      : `Video titled "${videoInfo.title}" by ${videoInfo.author}. ${transcriptData.fallbackContent || ""}`

    console.log(`Processed ${content.length} characters from YouTube video`)
    return content
  } catch (error: any) {
    console.error("Error processing YouTube content:", error)
    throw new Error(`Failed to process YouTube content: ${error.message}`)
  }
}

// URL content processor
export async function processUrlContent(url: string): Promise<string> {
  try {
    console.log("Processing content from URL:", url)

    // Fetch content from URL
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    // Extract text from HTML
    const text = extractTextFromHtml(html)

    // Truncate if too long
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + "..." : text

    console.log(`Extracted ${truncatedText.length} characters from URL`)
    return truncatedText
  } catch (error: any) {
    console.error("Error processing URL content:", error)
    throw new Error(`Failed to process URL content: ${error.message}`)
  }
}

// Helper function to extract YouTube video ID
function extractYoutubeVideoId(url: string): string | null {
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

// Helper function to extract text from HTML
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, " ")

  // Replace multiple spaces with a single space
  text = text.replace(/\s+/g, " ")

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ")
  text = text.replace(/&amp;/g, "&")
  text = text.replace(/&lt;/g, "<")
  text = text.replace(/&gt;/g, ">")
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  return text.trim()
}
