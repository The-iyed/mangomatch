// Error handling utilities

// Custom error class for quiz creation errors
export class QuizCreationError extends Error {
  public statusCode: number
  public context?: Record<string, any>

  constructor(message: string, statusCode = 500, context?: Record<string, any>) {
    super(message)
    this.name = "QuizCreationError"
    this.statusCode = statusCode
    this.context = context
  }
}

// Function to safely parse JSON from OpenAI responses
export function safeJsonParse(jsonString: string) {
  try {
    return { success: true, data: JSON.parse(jsonString) }
  } catch (error) {
    console.error("JSON parse error:", error)

    // Try to extract JSON from the string
    try {
      const jsonMatch = jsonString.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        return { success: true, data: JSON.parse(jsonMatch[0]) }
      }
    } catch (extractError) {
      console.error("JSON extraction error:", extractError)
    }

    return {
      success: false,
      error: "Failed to parse JSON response",
      originalString: jsonString,
    }
  }
}

// Function to log errors with context
export function logError(error: any, context?: Record<string, any>) {
  console.error("ERROR:", {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}
