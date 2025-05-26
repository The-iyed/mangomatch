import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { createQuiz } from "@/lib/quiz-creation"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const { title, description, categoryId, difficulty, transcript, videoUrl, numQuestions } = await request.json()

    if (!title || !transcript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the quiz
    const result = await createQuiz({
      title,
      description: description || "",
      categoryId: categoryId || null,
      difficulty: difficulty || "medium",
      userId: user.id,
      sourceType: "youtube",
      sourceContent: videoUrl || "",
      numQuestions: numQuestions || 10,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      quizId: result.quizId,
      questionCount: result.questionCount,
      answerCount: result.answerCount,
    })
  } catch (error: any) {
    console.error("Error in generate-quiz-from-youtube:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
