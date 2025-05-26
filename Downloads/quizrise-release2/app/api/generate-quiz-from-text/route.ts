import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization token" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]

    // Create Supabase client with the token
    const supabase = createServerSupabaseClient()

    // Set the auth token
    const { data: authData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authData.user) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 })
    }

    const user = authData.user

    // Parse the request body
    const { quizId, textContent, numQuestions = 5, categoryId, difficulty } = await request.json()

    if (!quizId || !textContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the quiz belongs to the current user
    const { data: quiz, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

    if (quizError || !quiz) {
      console.error("Quiz verification error:", quizError)
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.created_by !== user.id) {
      console.error("Unauthorized quiz access attempt")
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to modify this quiz" },
        { status: 403 },
      )
    }

    console.log(`Generating questions for quiz ID: ${quizId}`)
    console.log(`User ID: ${user.id}`)

    // Generate questions with OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Create a quiz with ${numQuestions} multiple-choice questions based on the following content:
        
        ${textContent.substring(0, 15000)}
        
        For each question, provide:
        1. The question text
        2. Four possible answers (A, B, C, D)
        3. Mark which answer is correct
        4. A brief explanation of why the correct answer is right
        
        The quiz should be at ${difficulty} difficulty level.
        
        Format your response as a valid JSON array with the following structure:
        [
          {
            "question": "Question text here?",
            "options": [
              {"text": "First answer", "isCorrect": false},
              {"text": "Second answer", "isCorrect": false},
              {"text": "Correct answer", "isCorrect": true},
              {"text": "Fourth answer", "isCorrect": false}
            ],
            "explanation": "Explanation of why the correct answer is right"
          }
        ]

        IMPORTANT: 
        - Return ONLY the raw JSON array without any markdown formatting.
        - Make sure each question has EXACTLY 4 answers.
        - Make sure EXACTLY ONE answer per question is marked as correct (isCorrect: true).
      `,
      temperature: 0.7,
      maxTokens: 4000,
    })

    // Parse the response
    let questions
    try {
      // Clean the response to handle markdown formatting
      let cleanedResponse = text.trim()

      // Remove markdown code block indicators if present
      if (cleanedResponse.includes("```")) {
        const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch && codeBlockMatch[1]) {
          cleanedResponse = codeBlockMatch[1].trim()
        } else {
          cleanedResponse = cleanedResponse.replace(/```(?:json)?/g, "").trim()
          cleanedResponse = cleanedResponse.replace(/```$/g, "").trim()
        }
      }

      questions = JSON.parse(cleanedResponse)
      console.log(`Successfully parsed ${questions.length} questions`)
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      return NextResponse.json({ error: "Failed to parse AI-generated questions" }, { status: 500 })
    }

    // Insert questions and answers
    let totalQuestionsCreated = 0
    let totalAnswersCreated = 0

    for (const q of questions) {
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quizId,
          question_text: q.question,
          explanation: q.explanation || "",
          order_num: totalQuestionsCreated + 1,
        })
        .select()
        .single()

      if (questionError) {
        console.error("Error creating question:", questionError)
        continue
      }

      totalQuestionsCreated++

      // Insert answers
      const answers = q.options.map((option: any) => ({
        question_id: questionData.id,
        answer_text: option.text,
        is_correct: option.isCorrect,
      }))

      const { data: answersData, error: answersError } = await supabase.from("answers").insert(answers).select()

      if (answersError) {
        console.error("Error creating answers:", answersError)
        continue
      }

      totalAnswersCreated += answersData.length
    }

    // Update quiz with question count
    await supabase.from("quizzes").update({ question_count: totalQuestionsCreated }).eq("id", quizId)

    return NextResponse.json({
      success: true,
      quizId: quizId,
      questionCount: totalQuestionsCreated,
      answerCount: totalAnswersCreated,
    })
  } catch (error: any) {
    console.error("Error in generate-quiz-from-text:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
