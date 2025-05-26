// Debugging utilities for quiz creation

// Enable debug mode in development
const DEBUG = process.env.NODE_ENV === "development"

// Debug logger
export function debug(area: string, message: string, data?: any) {
  if (!DEBUG) return

  console.log(`[DEBUG:${area}] ${message}`, data !== undefined ? data : "")
}

// Function to validate quiz data before submission
export function validateQuizData(data: any) {
  const issues = []

  // Check required fields
  if (!data.title) issues.push("Missing quiz title")
  if (!data.categoryId) issues.push("Missing category")
  if (!data.difficulty) issues.push("Missing difficulty")
  if (!data.userId) issues.push("Missing user ID")
  if (!data.sourceType) issues.push("Missing source type")

  // Check source-specific fields
  switch (data.sourceType) {
    case "pdf":
      if (!data.pdfUrl) issues.push("Missing PDF URL")
      break
    case "youtube":
      if (!data.youtubeUrl) issues.push("Missing YouTube URL")
      break
    case "url":
      if (!data.url) issues.push("Missing URL")
      break
    case "text":
      if (!data.sourceContent) issues.push("Missing text content")
      break
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

// Function to test OpenAI connection
export async function testOpenAiConnection() {
  try {
    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: 'Say "OpenAI connection successful" if you can read this.',
      maxTokens: 10,
    })

    return {
      success: true,
      message: text,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
