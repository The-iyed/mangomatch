import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Get request body
    const {
      title,
      description,
      categoryId,
      difficulty,
      userId,
      sourceType,
      sourceContent,
      pdfUrl,
      youtubeUrl,
      numQuestions = 5,
    } = await request.json()

    console.log(`Creating quiz: ${title} (${sourceType})`)

    // Validate required fields
    if (!title || !userId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Create the quiz in the database
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title,
        description: description || "",
        category_id: categoryId || null,
        difficulty: difficulty || "medium",
        user_id: userId,
        source_type: sourceType,
        source_content: sourceContent || pdfUrl || youtubeUrl || "",
      })
      .select()
      .single()

    if (quizError) {
      console.error("Error creating quiz:", quizError)
      return NextResponse.json({ success: false, error: quizError.message }, { status: 500 })
    }

    console.log(`Quiz created with ID: ${quiz.id}`)

    // Based on source type, call the appropriate API to generate questions
    let apiEndpoint
    const apiBody: any = {
      quizId: quiz.id,
      numQuestions,
    }

    switch (sourceType) {
      case "pdf":
        apiEndpoint = "/api/generate-quiz-from-pdf"
        apiBody.pdfUrl = pdfUrl
        break
      case "youtube":
        apiEndpoint = "/api/generate-quiz-from-youtube"
        apiBody.youtubeUrl = youtubeUrl
        break
      case "text":
        apiEndpoint = "/api/generate-quiz-from-text"
        apiBody.text = sourceContent
        break
      case "url":
        apiEndpoint = "/api/generate-quiz-from-url"
        apiBody.url = sourceContent
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid source type" }, { status: 400 })
    }

    // Call the appropriate API endpoint
    try {
      const response = await fetch(new URL(apiEndpoint, request.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error from ${apiEndpoint}:`, errorText)

        // Delete the quiz since generation failed
        await supabase.from("quizzes").delete().eq("id", quiz.id)

        return NextResponse.json(
          { success: false, error: `Failed to generate questions: ${errorText.substring(0, 100)}` },
          { status: 500 },
        )
      }

      const result = await response.json()

      return NextResponse.json({
        success: true,
        quizId: quiz.id,
        questionCount: result.questionCount || 0,
      })
    } catch (error: any) {
      console.error(`Error calling ${apiEndpoint}:`, error)

      // Delete the quiz since generation failed
      await supabase.from("quizzes").delete().eq("id", quiz.id)

      return NextResponse.json({ success: false, error: `API error: ${error.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in generate-quiz:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
