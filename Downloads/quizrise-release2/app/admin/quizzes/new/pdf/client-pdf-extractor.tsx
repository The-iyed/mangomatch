"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload, Loader2, Brain } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

// Add this comment to explain the PDF.js worker handling
// We're not using PDF.js directly in this component anymore
// Text extraction is handled by the server-side API

interface ClientPdfExtractorProps {
  onExtracted: (text: string) => void
  onCancel: () => void
}

export function ClientPdfExtractor({ onExtracted, onCancel }: ClientPdfExtractorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const extractText = async () => {
    if (!file) return

    setIsExtracting(true)
    setProgress(10)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("pdf", file)

      setProgress(30)

      // Send the file to our API endpoint for text extraction
      const response = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: formData,
      })

      setProgress(70)

      if (!response.ok) {
        throw new Error("Failed to extract text from PDF")
      }

      const result = await response.json()

      setProgress(100)

      if (!result.success) {
        throw new Error(result.error || "Failed to extract text from PDF")
      }

      setExtractedText(result.text)
      onExtracted(result.text)
    } catch (error: any) {
      console.error("Error extracting text:", error)

      toast({
        title: "Error extracting text",
        description: "Failed to extract text from PDF. Using file name and metadata instead.",
        variant: "destructive",
      })

      // Fallback: use the file name as a basic context
      const fallbackText = `This quiz is based on the PDF document titled "${file.name}". 
      The document was uploaded for quiz generation but text extraction failed.
      Please generate quiz questions based on the general topic suggested by the file name.`

      setExtractedText(fallbackText)
      onExtracted(fallbackText)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Extract Text for AI Quiz Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedText ? (
          <>
            <p className="text-sm text-muted-foreground">
              Upload your PDF file to extract text. This text will be sent to our AI to generate quiz questions based on
              the content.
            </p>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("pdf-file")?.click()}
                className="w-full"
                disabled={isExtracting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? "Change file" : "Upload PDF"}
              </Button>
              <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            {isExtracting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Extracting text...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Text extracted successfully! This text will be sent to our AI to generate quiz questions based on the
              content.
            </p>
            <div className="max-h-60 overflow-y-auto rounded border p-2">
              <pre className="text-xs">{extractedText.substring(0, 500)}...</pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isExtracting}>
          Cancel
        </Button>
        {!extractedText ? (
          <Button onClick={extractText} disabled={!file || isExtracting}>
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract Text for AI"
            )}
          </Button>
        ) : (
          <Button onClick={() => onExtracted(extractedText)}>
            <Brain className="mr-2 h-4 w-4" />
            Continue to Quiz Creation
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
