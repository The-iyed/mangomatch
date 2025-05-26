import { NextResponse } from "next/server"

/**
 * Extracts text from a PDF URL using a simplified approach
 * that doesn't rely on PDF.js
 */
export async function extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
  try {
    // Fetch the PDF file
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    // Get the PDF data as text
    // This is a simplified approach that won't work perfectly for all PDFs
    // but avoids the PDF.js worker issues
    const pdfData = await response.text()

    // Extract text using a simple regex approach
    // This will extract text that appears between common PDF text markers
    let extractedText = ""

    // Look for text between BT (Begin Text) and ET (End Text) markers
    const textMatches = pdfData.match(/BT\s*([^]*?)\s*ET/g)
    if (textMatches) {
      extractedText = textMatches
        .join(" ")
        .replace(/\s+/g, " ")
        .replace(/\[$$([^)]+)$$\]/g, "$1") // Extract text from PDF array notation [(text)]
        .replace(/[^\x20-\x7E]/g, " ") // Remove non-printable characters
    }

    // If we couldn't extract text with the regex approach, use the raw content
    if (extractedText.length < 100) {
      // Just use the raw content, filtered for printable ASCII
      extractedText = pdfData
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\s+/g, " ")
        .substring(0, 15000)
    }

    // Limit text length to avoid token limits
    const maxLength = 15000
    if (extractedText.length > maxLength) {
      console.log(`Truncating text from ${extractedText.length} to ${maxLength} characters`)
      extractedText = extractedText.substring(0, maxLength)
    }

    return extractedText
  } catch (error: any) {
    console.error("Error extracting text from PDF:", error)
    throw new Error(`Failed to extract text from PDF: ${error.message}`)
  }
}

/**
 * Extracts information from a PDF URL without using PDF.js
 */
export async function extractInfoFromPdfUrl(pdfUrl: string): Promise<{
  description: string
  filename: string
}> {
  try {
    // Get the filename from the URL
    const filename = pdfUrl.split("/").pop() || "document.pdf"

    // Create a description based on the filename
    const filenameParts = filename.replace(/[_-]/g, " ").replace(".pdf", "").split(" ")

    let description = `This quiz is based on a PDF document titled "${filename.replace(".pdf", "")}". `

    // Add some context based on the filename
    if (filenameParts.length > 1) {
      description += `The document appears to be about ${filenameParts.join(", ")}. `
    }

    description += `Please generate quiz questions based on what might be contained in a document with this name.`

    return {
      description,
      filename,
    }
  } catch (error: any) {
    console.error("Error extracting info from PDF:", error)
    throw new Error(`Failed to extract info from PDF: ${error.message}`)
  }
}

/**
 * API handler for extracting text from a PDF URL
 */
export async function handlePdfTextExtraction(request: Request) {
  try {
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ success: false, error: "Missing PDF URL" }, { status: 400 })
    }

    const extractedText = await extractTextFromPdfUrl(pdfUrl)

    return NextResponse.json({
      success: true,
      text: extractedText,
    })
  } catch (error: any) {
    console.error("Error in PDF text extraction API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * API handler for extracting info from a PDF URL
 */
export async function handlePdfInfoExtraction(request: Request) {
  try {
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ success: false, error: "Missing PDF URL" }, { status: 400 })
    }

    const { description, filename } = await extractInfoFromPdfUrl(pdfUrl)

    return NextResponse.json({
      success: true,
      text: description,
      fileName: filename,
    })
  } catch (error: any) {
    console.error("Error in PDF info extraction API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
