import { createServerSupabaseClient } from "@/lib/supabase"
import { generateQuizQuestions } from "@/lib/openai"

type QuizSource = "pdf" | "youtube" | "text" | "url"

interface QuizCreationParams {
  title: string
  description: string
  categoryId: string
  difficulty: string
  userId: string
  sourceType: QuizSource
  sourceContent: string
  numQuestions: number
}

export async function createQuiz(params: QuizCreationParams) {
  const supabase = createServerSupabaseClient()

  try {
    console.log(`Creating quiz: ${params.title} (${params.sourceType})`)

    // Step 1: Create the quiz record
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title: params.title,
        description: params.description,
        category_id: params.categoryId,
        difficulty: params.difficulty,
        created_by: params.userId,
        source_type: params.sourceType,
        source_content: params.sourceContent.substring(0, 10000), // Limit stored content size
        question_count: 0, // Will update after generating questions
      })
      .select()
      .single()

    if (quizError) {
      console.error("Error creating quiz:", quizError)
      throw new Error(`Failed to create quiz: ${quizError.message}`)
    }

    console.log(`Quiz created with ID: ${quiz.id}`)

    // Step 2: Generate questions with OpenAI
    console.log("Generating questions with OpenAI...")
    const questions = await generateQuizQuestions(params.sourceContent, params.numQuestions)
    console.log(`Generated ${questions.length} questions`)

    // Step 3: Insert questions and answers
    let totalAnswersCreated = 0
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      console.log(`Processing question ${i + 1}: "${q.question.substring(0, 50)}..."`)

      // Log answer options for debugging
      console.log(`Question ${i + 1} has ${q.options.length} answer options:`)
      q.options.forEach((opt: any, index: number) => {
        console.log(`- Option ${index + 1}: "${opt.text.substring(0, 30)}..." (Correct: ${opt.isCorrect})`)
      })

      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quiz.id,
          question_text: q.question,
          explanation: q.explanation || "",
          order_num: i + 1,
        })
        .select()
        .single()

      if (questionError) {
        console.error(`Error creating question ${i + 1}:`, questionError)
        throw new Error(`Error creating question: ${questionError.message}`)
      }

      console.log(`Created question with ID: ${questionData.id}`)

      // Insert answers
      const answers = q.options.map((option: any) => ({
        question_id: questionData.id,
        answer_text: option.text,
        is_correct: option.isCorrect,
      }))

      const { data: answersData, error: answersError } = await supabase.from("answers").insert(answers).select()

      if (answersError) {
        console.error(`Error creating answers for question ${i + 1}:`, answersError)
        throw new Error(`Error creating answers: ${answersError.message}`)
      }

      console.log(`Created ${answersData.length} answers for question ${i + 1}`)
      totalAnswersCreated += answersData.length
    }

    // Step 4: Update quiz with question count
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({ question_count: questions.length })
      .eq("id", quiz.id)

    if (updateError) {
      console.warn(`Warning: Could not update question count: ${updateError.message}`)
    }

    console.log(`Quiz creation complete: ${questions.length} questions with ${totalAnswersCreated} total answers`)

    return {
      success: true,
      quizId: quiz.id,
      questionCount: questions.length,
      answerCount: totalAnswersCreated,
    }
  } catch (error: any) {
    console.error("Error in quiz creation:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
