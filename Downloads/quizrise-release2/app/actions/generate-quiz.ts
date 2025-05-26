"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { generateQuizQuestions } from "@/lib/openai"
import { revalidatePath } from "next/cache"

export async function generateQuizFromText(quizId: string, text: string, numQuestions = 5) {
  const supabase = createServerSupabaseClient()

  try {
    // Generate questions using OpenAI
    const questions = await generateQuizQuestions(text, numQuestions)

    // Get the quiz
    const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

    if (!quiz) {
      throw new Error("Quiz not found")
    }

    // Insert questions and answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]

      // Insert question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quizId,
          question_text: q.question,
          explanation: q.explanation,
          order_num: i + 1,
        })
        .select()
        .single()

      if (questionError) {
        throw new Error(`Error creating question: ${questionError.message}`)
      }

      // Insert options/answers
      for (const option of q.options) {
        const { error: optionError } = await supabase.from("answers").insert({
          question_id: question.id,
          answer_text: option.text,
          is_correct: option.isCorrect,
        })

        if (optionError) {
          throw new Error(`Error creating answer: ${optionError.message}`)
        }
      }
    }

    // Update quiz with question count
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({ question_count: questions.length })
      .eq("id", quizId)

    if (updateError) {
      throw new Error(`Error updating quiz: ${updateError.message}`)
    }

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath(`/admin/quizzes`)

    return { success: true, questionCount: questions.length }
  } catch (error: any) {
    console.error("Error generating quiz:", error)
    return { success: false, error: error.message }
  }
}

export async function generateQuizFromUrl(quizId: string, url: string, numQuestions = 5) {
  try {
    // Fetch content from URL
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    // Extract text from HTML (basic implementation)
    const textContent = extractTextFromHtml(html)

    // Generate quiz from the extracted text
    return generateQuizFromText(quizId, textContent, numQuestions)
  } catch (error: any) {
    console.error("Error generating quiz from URL:", error)
    return { success: false, error: error.message }
  }
}

export async function generateQuizFromYoutube(quizId: string, youtubeUrl: string, numQuestions = 5) {
  try {
    // Extract video ID from URL
    const videoId = extractYoutubeVideoId(youtubeUrl)
    if (!videoId) {
      throw new Error("Invalid YouTube URL")
    }

    // Fetch transcript (this is a placeholder - you would need a proper YouTube transcript API)
    const transcript = await fetchYoutubeTranscript(videoId)

    // Generate quiz from the transcript
    return generateQuizFromText(quizId, transcript, numQuestions)
  } catch (error: any) {
    console.error("Error generating quiz from YouTube:", error)
    return { success: false, error: error.message }
  }
}

// Helper function to extract text from HTML
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, " ")

  // Replace multiple spaces with a single space
  text = text.replace(/\s+/g, " ")

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ")
  text = text.replace(/&amp;/g, "&")
  text = text.replace(/&lt;/g, "<")
  text = text.replace(/&gt;/g, ">")
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  return text.trim()
}

// Helper function to extract YouTube video ID
function extractYoutubeVideoId(url: string): string | null {
  try {
    // Handle different YouTube URL formats
    let id = null

    // Regular YouTube URL
    if (url.includes("youtube.com/watch?v=")) {
      const urlObj = new URL(url)
      id = urlObj.searchParams.get("v")
    }
    // Shortened youtu.be URL
    else if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/")
      if (parts.length > 1) {
        id = parts[1].split("?")[0]
      }
    }
    // YouTube embed URL
    else if (url.includes("youtube.com/embed/")) {
      const parts = url.split("youtube.com/embed/")
      if (parts.length > 1) {
        id = parts[1].split("?")[0]
      }
    }

    return id
  } catch (error) {
    return null
  }
}

// Placeholder function for fetching YouTube transcript
// In a real implementation, you would use a proper YouTube transcript API
async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  // This is a placeholder - in a real implementation, you would use a proper API
  // For example, you might use the YouTube Data API or a third-party service

  // For now, we'll return a placeholder message
  return `This is a placeholder transcript for YouTube video ${videoId}. In a real implementation, you would fetch the actual transcript from YouTube's API or a third-party service. The transcript would contain the spoken content of the video, which would then be used to generate quiz questions.`
}
