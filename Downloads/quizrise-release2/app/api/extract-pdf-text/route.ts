import { NextResponse } from "next/server"
import { handlePdfTextExtraction } from "@/lib/pdf-utils"

export async function POST(request: Request) {
  try {
    // Parse request body
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ success: false, error: "Missing PDF URL" }, { status: 400 })
    }

    // Get the filename from the URL
    const filename = pdfUrl.split("/").pop() || "document.pdf"

    // Create a description based on the filename
    const filenameParts = filename.replace(/[_-]/g, " ").replace(".pdf", "").split(" ")

    let extractedText = `This quiz is based on a PDF document titled "${filename.replace(".pdf", "")}". `

    // Add some context based on the filename
    if (filenameParts.length > 1) {
      extractedText += `The document appears to be about ${filenameParts.join(", ")}. `
    }

    extractedText += `Please generate quiz questions based on what might be contained in a document with this name.`

    // Call the existing PDF text extraction function
    const pdfText = await handlePdfTextExtraction(pdfUrl)

    // Combine the extracted text with the description
    extractedText += `\n\nExtracted Text:\n${pdfText}`

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: filename,
    })
  } catch (error: any) {
    console.error("Error extracting PDF text:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
