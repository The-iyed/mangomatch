import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateQuizQuestions(content: string, numQuestions = 5) {
  try {
    console.log("Calling OpenAI to generate quiz questions...")

    // Truncate content if it's too long
    const truncatedContent = content.length > 15000 ? content.substring(0, 15000) + "..." : content

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Create a quiz with ${numQuestions} multiple-choice questions based on the following content:
        
        ${truncatedContent}
        
        For each question, provide:
        1. The question text
        2. Four possible answers (A, B, C, D)
        3. Mark which answer is correct
        4. A brief explanation of why the correct answer is right
        
        IMPORTANT INSTRUCTIONS:
        - ALWAYS provide EXACTLY 4 answer options for EVERY question, no matter what
        - If the content doesn't directly provide answers, be creative and generate plausible options
        - ALWAYS mark EXACTLY ONE option as correct for each question
        - For questions where the correct answer isn't clear from the content, make an educated guess
        - Never leave a question without 4 answer options
        - Never leave a question without marking one option as correct
        - Make the incorrect options plausible but clearly wrong upon reflection
        
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

        IMPORTANT: 
        - Return ONLY the raw JSON array without any markdown formatting, code blocks, or explanations.
        - DO NOT include \`\`\`json or any other markdown formatting.
        - Make sure each question has EXACTLY 4 answers.
        - Make sure EXACTLY ONE answer per question is marked as correct (isCorrect: true).
      `,
      temperature: 0.7,
      maxTokens: 4000,
    })

    console.log("OpenAI response received")

    // Clean the response to handle markdown formatting
    let cleanedResponse = text.trim()

    // Remove markdown code block indicators if present
    if (cleanedResponse.includes("```")) {
      console.log("Detected markdown code blocks, cleaning...")
      // Find the content inside code blocks
      const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch && codeBlockMatch[1]) {
        cleanedResponse = codeBlockMatch[1].trim()
        console.log("Extracted content from code block")
      } else {
        // If we can't extract from code block, try removing just the starting and ending markers
        cleanedResponse = cleanedResponse.replace(/```(?:json)?/g, "").trim()
        cleanedResponse = cleanedResponse.replace(/```$/g, "").trim()
        console.log("Removed code block markers")
      }
    }

    console.log("Parsing JSON response...")

    try {
      // Parse the cleaned response
      const parsedQuestions = JSON.parse(cleanedResponse)
      console.log(`Successfully parsed ${parsedQuestions.length} questions`)

      // Validate and fix the questions
      const validatedQuestions = parsedQuestions.map((q: any, index: number) => {
        // Ensure question has all required fields
        if (!q.question) {
          console.warn(`Question ${index + 1} missing question text, adding placeholder`)
          q.question = `Question ${index + 1}`
        }

        // Handle both "options" and "answers" fields for backward compatibility
        let answers = q.answers || q.options || []

        // Ensure answers exist and there are exactly 4
        if (!Array.isArray(answers) || answers.length !== 4) {
          console.warn(`Question ${index + 1} missing answers or doesn't have exactly 4, adding placeholders`)
          answers = [
            { text: "This is the correct answer", isCorrect: true },
            { text: "This is incorrect answer B", isCorrect: false },
            { text: "This is incorrect answer C", isCorrect: false },
            { text: "This is incorrect answer D", isCorrect: false },
          ]
        }

        // Ensure exactly one answer is marked as correct
        const correctAnswers = answers.filter((ans: any) => ans.isCorrect === true)
        if (correctAnswers.length !== 1) {
          console.warn(`Question ${index + 1} doesn't have exactly one correct answer, fixing`)
          // Mark all as incorrect first
          answers.forEach((ans: any) => (ans.isCorrect = false))
          // Then mark the first one as correct
          answers[0].isCorrect = true
        }

        // Ensure explanation exists
        if (!q.explanation) {
          console.warn(`Question ${index + 1} missing explanation, adding placeholder`)
          q.explanation = "The correct answer is the most accurate based on the content provided."
        }

        // Always use "answers" field for consistency
        return {
          question: q.question,
          answers: answers,
          explanation: q.explanation,
        }
      })

      return validatedQuestions
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError)
      console.error("Cleaned response (first 200 chars):", cleanedResponse.substring(0, 200))

      // Create fallback questions with guaranteed answers
      console.log("Creating fallback questions with guaranteed answers")
      const fallbackQuestions = []

      for (let i = 0; i < numQuestions; i++) {
        const contentWords = truncatedContent.split(" ")
        const randomWord = contentWords[Math.floor(Math.random() * contentWords.length)] || "topic"

        fallbackQuestions.push({
          question: `Question ${i + 1} about ${randomWord}?`,
          answers: [
            { text: `This is the correct answer for question ${i + 1}`, isCorrect: true },
            { text: `This is incorrect answer B for question ${i + 1}`, isCorrect: false },
            { text: `This is incorrect answer C for question ${i + 1}`, isCorrect: false },
            { text: `This is incorrect answer D for question ${i + 1}`, isCorrect: false },
          ],
          explanation: `This is the explanation for why the first option is correct for question ${i + 1}.`,
        })
      }

      console.log(`Created ${fallbackQuestions.length} fallback questions`)
      return fallbackQuestions
    }
  } catch (error) {
    console.error("Error generating quiz questions:", error)

    // Return fallback questions if everything fails
    const fallbackQuestions = []
    for (let i = 0; i < numQuestions; i++) {
      fallbackQuestions.push({
        question: `Fallback question ${i + 1}?`,
        answers: [
          { text: "This is the correct answer", isCorrect: true },
          { text: "This is incorrect answer B", isCorrect: false },
          { text: "This is incorrect answer C", isCorrect: false },
          { text: "This is incorrect answer D", isCorrect: false },
        ],
        explanation: "This is a fallback question due to an error in generating questions.",
      })
    }

    return fallbackQuestions
  }
}
