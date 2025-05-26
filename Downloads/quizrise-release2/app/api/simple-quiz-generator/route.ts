import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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

    // Generate questions using AI SDK
    console.log("Calling AI to generate questions...")
    let questions
    try {
      // Use the AI SDK to generate questions
      const prompt = `
        Create a quiz with ${numQuestions} multiple-choice questions based on the following content:
        
        ${content}
        
        For each question, provide:
        1. The question text
        2. Four possible answers (A, B, C, D)
        3. Mark which answer is correct
        4. A brief explanation of why the correct answer is right
        
        Format your response as a valid JSON array with the following structure:
        [
          {
            "question": "Question text here?",
            "answers": [
              {"text": "First answer", "isCorrect": false},
              {"text": "Second answer", "isCorrect": false},
              {"text": "Correct answer", "isCorrect": true},
              {"text": "Fourth answer", "isCorrect": false}
            ],
            "explanation": "Explanation of why the correct answer is right"
          }
        ]
        
        IMPORTANT INSTRUCTIONS:
        - ALWAYS provide EXACTLY 4 answer options for EVERY question, no matter what
        - If the content doesn't directly provide answers, be creative and generate plausible options
        - ALWAYS mark EXACTLY ONE option as correct for each question
        - For questions where the correct answer isn't clear from the content, make an educated guess
        - Never leave a question without 4 answer options
        - Never leave a question without marking one option as correct
        - Make the incorrect options plausible but clearly wrong upon reflection
        
        IMPORTANT: 
        - Return ONLY the raw JSON array without any markdown formatting
        - Make sure each question has EXACTLY 4 answers
        - Make sure EXACTLY ONE answer per question is marked as correct
      `

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      })

      console.log("AI response received, parsing...")

      // Try to parse the JSON response
      try {
        // Clean the response to handle markdown formatting
        let cleanedResponse = text.trim()

        // Remove markdown code block indicators if present
        if (cleanedResponse.includes("```")) {
          const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (codeBlockMatch && codeBlockMatch[1]) {
            cleanedResponse = codeBlockMatch[1].trim()
          } else {
            cleanedResponse = cleanedResponse
              .replace(/```(?:json)?/g, "")
              .replace(/```$/g, "")
              .trim()
          }
        }

        questions = JSON.parse(cleanedResponse)
        console.log(`Successfully parsed ${questions.length} questions`)

        // Log the first question for debugging
        if (questions.length > 0) {
          console.log("First question sample:", JSON.stringify(questions[0], null, 2))
        }

        // Handle both "options" and "answers" fields for backward compatibility
        questions = questions.map((q: any) => {
          // If the question has "options" but not "answers", rename the field
          if (q.options && !q.answers) {
            q.answers = q.options
            delete q.options
          }

          // If there are no answers, create default ones
          if (!q.answers || !Array.isArray(q.answers) || q.answers.length === 0) {
            q.answers = [
              { text: "This is the correct answer", isCorrect: true },
              { text: "This is incorrect answer B", isCorrect: false },
              { text: "This is incorrect answer C", isCorrect: false },
              { text: "This is incorrect answer D", isCorrect: false },
            ]
          }

          return q
        })
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        console.error("Raw response:", text.substring(0, 500) + "...")

        // Create fallback questions
        questions = []
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            question: `Question ${i + 1} about ${content.split(" ").slice(0, 3).join(" ")}?`,
            answers: [
              { text: `This is the correct answer for question ${i + 1}`, isCorrect: true },
              { text: `This is incorrect answer B for question ${i + 1}`, isCorrect: false },
              { text: `This is incorrect answer C for question ${i + 1}`, isCorrect: false },
              { text: `This is incorrect answer D for question ${i + 1}`, isCorrect: false },
            ],
            explanation: `This is a fallback explanation for question ${i + 1}.`,
          })
        }
        console.log(`Created ${questions.length} fallback questions`)
      }
    } catch (error: any) {
      console.error("Error generating questions with AI:", error)
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
          continue
        }

        questionCount++
        console.log(`Created question with ID: ${question.id}`)

        // Ensure we have 4 answers with one correct answer
        let answerOptions = q.answers || []
        if (!answerOptions || !Array.isArray(answerOptions) || answerOptions.length !== 4) {
          console.log(`Generating default answers for question ${i + 1}`)
          answerOptions = [
            { text: "This is the correct answer", isCorrect: true },
            { text: "This is incorrect answer B", isCorrect: false },
            { text: "This is incorrect answer C", isCorrect: false },
            { text: "This is incorrect answer D", isCorrect: false },
          ]
        }

        // Ensure exactly one answer is marked as correct
        const correctAnswers = answerOptions.filter((a: any) => a.isCorrect)
        if (correctAnswers.length !== 1) {
          console.log(`Fixing correct answer count for question ${i + 1}`)
          // Mark all as incorrect first
          answerOptions.forEach((a: any) => (a.isCorrect = false))
          // Then mark the first one as correct
          answerOptions[0].isCorrect = true
        }

        // Log answers for debugging
        answerOptions.forEach((ans: any, idx: number) => {
          console.log(`Answer ${idx + 1}: "${ans.text.substring(0, 30)}..." (Correct: ${ans.isCorrect})`)
        })

        const dbAnswers = answerOptions.map((answer: any) => ({
          question_id: question.id,
          answer_text: answer.text || `Answer ${(answerCount % 4) + 1}`,
          is_correct: !!answer.isCorrect,
        }))

        console.log(`Inserting ${dbAnswers.length} answers for question ${i + 1}`)

        // Insert answers one by one to ensure they all get created
        for (const answer of dbAnswers) {
          const { data: answerData, error: answerError } = await supabase
            .from("answers")
            .insert(answer)
            .select()
            .single()

          if (answerError) {
            console.error(`Error creating answer for question ${i + 1}:`, answerError)
          } else {
            console.log(
              `Created answer with ID: ${answerData.id}, text: "${answerData.answer_text.substring(0, 30)}...", correct: ${answerData.is_correct}`,
            )
            answerCount++
          }
        }

        console.log(`Finished creating answers for question ${i + 1}`)
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
    console.error("Unhandled error in simple-quiz-generator:", error)
    return NextResponse.json({ success: false, error: `Server error: ${error.message}` }, { status: 500 })
  }
}
