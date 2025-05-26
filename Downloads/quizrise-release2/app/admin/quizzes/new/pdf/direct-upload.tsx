"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload, Loader2, Brain } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { getClientSupabaseInstance } from "@/lib/supabase"

interface DirectUploadProps {
  bucketName: string
  onUploaded: (url: string) => void
  onCancel: () => void
}

export function DirectUpload({ bucketName, onUploaded, onCancel }: DirectUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const supabase = getClientSupabaseInstance()

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

  const uploadFile = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `quiz-pdfs/${fileName}`

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) {
        // Check if this is an RLS policy error
        if (uploadError.message.includes("row-level security") || uploadError.message.includes("Unauthorized")) {
          throw new Error(`Upload error: Row-level security policy violation. Please fix the bucket policies.`)
        }
        throw new Error(`Upload error: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
      const fileUrl = urlData.publicUrl

      onUploaded(fileUrl)
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload PDF",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Upload PDF for AI Quiz Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload your PDF file to our secure storage. Our AI will extract the text and generate quiz questions based on
          the content.
        </p>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("pdf-upload")?.click()}
            className="w-full"
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {file ? "Change file" : "Select PDF"}
          </Button>
          <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
        </div>

        {file && (
          <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <div className="rounded-md bg-muted p-3 text-sm">
          <p>After uploading, our AI will:</p>
          <ol className="list-decimal pl-5 pt-2 space-y-1">
            <li>Extract text from your PDF</li>
            <li>Analyze the content</li>
            <li>Generate quiz questions based on the material</li>
            <li>Store everything in the database</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={uploadFile} disabled={!file || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Upload for AI Processing
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
