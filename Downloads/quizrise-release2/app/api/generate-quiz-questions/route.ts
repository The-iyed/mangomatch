import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { generateQuizQuestions } from "@/lib/openai"

export async function POST(request: Request) {
  try {
    console.log("Received request to generate quiz questions")

    // Parse request body
    const { quizId, content, numQuestions = 5 } = await request.json()

    if (!quizId || !content) {
      console.error("Missing required parameters:", { quizId, contentLength: content?.length })
      return NextResponse.json(
        { success: false, error: "Missing required parameters: quizId and content" },
        { status: 400 },
      )
    }

    console.log(`Generating questions for quiz ${quizId} (${numQuestions} questions)`)

    const supabase = createServerSupabaseClient()

    // Check if quiz exists
    const { data: quiz, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

    if (quizError) {
      console.error("Error fetching quiz:", quizError)
      return NextResponse.json({ success: false, error: `Quiz not found: ${quizError.message}` }, { status: 404 })
    }

    // Generate questions using OpenAI
    console.log("Calling OpenAI to generate questions...")
    let questions
    try {
      questions = await generateQuizQuestions(content, numQuestions)
      console.log(`Generated ${questions.length} questions`)
    } catch (error: any) {
      console.error("Error generating questions with OpenAI:", error)
      return NextResponse.json(
        { success: false, error: `Failed to generate questions: ${error.message}` },
        { status: 500 },
      )
    }

    // Insert questions and answers
    console.log("Inserting questions and answers into database...")
    let questionCount = 0
    let answerCount = 0

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      console.log(`Processing question ${i + 1}: "${q.question.substring(0, 50)}..."`)

      try {
        // Insert question
        const { data: question, error: questionError } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizId,
            question_text: q.question,
            explanation: q.explanation || "",
            order_num: i + 1,
          })
          .select()
          .single()

        if (questionError) {
          console.error(`Error creating question ${i + 1}:`, questionError)
          throw new Error(`Failed to create question: ${questionError.message}`)
        }

        questionCount++
        console.log(`Created question with ID: ${question.id}`)

        // Insert answers
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          console.warn(`Question ${i + 1} has no options, creating default options`)
          q.options = [
            { text: "Option A", isCorrect: true },
            { text: "Option B", isCorrect: false },
            { text: "Option C", isCorrect: false },
            { text: "Option D", isCorrect: false },
          ]
        }

        const answers = q.options.map((option: any) => ({
          question_id: question.id,
          answer_text: option.text || "No answer text provided",
          is_correct: !!option.isCorrect,
        }))

        const { data: answersData, error: answersError } = await supabase.from("answers").insert(answers).select()

        if (answersError) {
          console.error(`Error creating answers for question ${i + 1}:`, answersError)
          throw new Error(`Failed to create answers: ${answersError.message}`)
        }

        answerCount += answersData.length
        console.log(`Created ${answersData.length} answers for question ${i + 1}`)
      } catch (error: any) {
        console.error(`Error processing question ${i + 1}:`, error)
        // Continue with next question instead of failing completely
        continue
      }
    }

    // Update quiz with question count
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({ question_count: questionCount })
      .eq("id", quizId)

    if (updateError) {
      console.warn(`Warning: Could not update question count: ${updateError.message}`)
    }

    console.log(`Quiz generation complete: ${questionCount} questions with ${answerCount} total answers`)

    return NextResponse.json({
      success: true,
      quizId,
      questionCount,
      answerCount,
    })
  } catch (error: any) {
    console.error("Unhandled error in generate-quiz-questions:", error)
    return NextResponse.json({ success: false, error: `Server error: ${error.message}` }, { status: 500 })
  }
}
