import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const quizId = url.searchParams.get("quizId")

    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId parameter" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get quiz details
    const { data: quiz, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

    if (quizError) {
      return NextResponse.json({ error: `Quiz not found: ${quizError.message}` }, { status: 404 })
    }

    // Get questions with answers - using explicit foreign key reference
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        explanation,
        order_num,
        answers!answers_question_id_fkey (
          id,
          answer_text,
          is_correct
        )
      `)
      .eq("quiz_id", quizId)
      .order("order_num", { ascending: true })

    if (questionsError) {
      return NextResponse.json({ error: `Error fetching questions: ${questionsError.message}` }, { status: 500 })
    }

    // Direct query to check answers separately
    const { data: allAnswers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .in(
        "question_id",
        questions.map((q) => q.id),
      )

    if (answersError) {
      return NextResponse.json({ error: `Error fetching answers: ${answersError.message}` }, { status: 500 })
    }

    // Group answers by question_id for debugging
    const answersByQuestion = allAnswers.reduce((acc: any, answer: any) => {
      if (!acc[answer.question_id]) {
        acc[answer.question_id] = []
      }
      acc[answer.question_id].push(answer)
      return acc
    }, {})

    // Count answers
    let totalAnswers = 0
    let questionsWithoutAnswers = 0

    questions.forEach((question) => {
      if (!question.answers || question.answers.length === 0) {
        questionsWithoutAnswers++
      } else {
        totalAnswers += question.answers.length
      }
    })

    return NextResponse.json({
      quiz,
      questionCount: questions.length,
      totalAnswers,
      questionsWithoutAnswers,
      directAnswerCount: allAnswers.length,
      questions: questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        answerCount: q.answers ? q.answers.length : 0,
        hasCorrectAnswer: q.answers ? q.answers.some((a: any) => a.is_correct) : false,
        answers: q.answers,
      })),
      // Include direct answer query results for debugging
      answersByQuestion,
    })
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
