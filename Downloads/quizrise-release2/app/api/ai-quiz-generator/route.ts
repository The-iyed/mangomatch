import { createServerSupabaseClient } from "@/lib/supabase"
import { generateQuizQuestions } from "@/lib/openai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const {
      pdfText,
      quizTitle,
      quizDescription,
      categoryId,
      difficulty,
      numQuestions = 5,
      userId,
    } = await request.json()

    if (!pdfText || !quizTitle || !categoryId || !difficulty || !userId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    console.log("Creating quiz with AI:", { quizTitle, categoryId, difficulty, numQuestions })

    const supabase = createServerSupabaseClient()

    // Create the quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title: quizTitle,
        description: quizDescription || `Quiz generated from PDF content`,
        category_id: categoryId,
        difficulty,
        created_by: userId,
        question_count: 0, // Will update this after generating questions
        source_type: "pdf",
      })
      .select()
      .single()

    if (quizError) {
      console.error("Error creating quiz:", quizError)
      return NextResponse.json({ success: false, error: quizError.message }, { status: 500 })
    }

    console.log("Quiz created:", quiz.id)
    console.log("Generating questions with OpenAI...")

    // Generate questions using OpenAI
    let questions
    try {
      questions = await generateQuizQuestions(pdfText, numQuestions)
      console.log(`Generated ${questions.length} questions`)
    } catch (error: any) {
      console.error("Error generating questions:", error)

      // Delete the quiz since we couldn't generate questions
      await supabase.from("quizzes").delete().eq("id", quiz.id)

      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate questions: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Insert questions and answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]

      // Insert question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quiz.id,
          question_text: q.question,
          explanation: q.explanation,
          order_num: i + 1,
        })
        .select()
        .single()

      if (questionError) {
        console.error("Error creating question:", questionError)
        return NextResponse.json(
          { success: false, error: `Error creating question: ${questionError.message}` },
          { status: 500 },
        )
      }

      // Insert options/answers
      for (const option of q.options) {
        const { error: optionError } = await supabase.from("answers").insert({
          question_id: question.id,
          answer_text: option.text,
          is_correct: option.isCorrect,
        })

        if (optionError) {
          console.error("Error creating answer:", optionError)
          return NextResponse.json(
            { success: false, error: `Error creating answer: ${optionError.message}` },
            { status: 500 },
          )
        }
      }
    }

    // Update quiz with question count
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({ question_count: questions.length })
      .eq("id", quiz.id)

    if (updateError) {
      console.error("Error updating quiz:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    console.log("Quiz generation completed successfully")
    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      questionCount: questions.length,
    })
  } catch (error: any) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
