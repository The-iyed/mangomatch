import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { bucketName } = await request.json()

    if (!bucketName) {
      return NextResponse.json({ error: "Bucket name is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Execute SQL to set up storage policies
    const { error } = await supabase.rpc("setup_storage_policies", { bucket_id: bucketName })

    if (error) {
      console.error("Error setting up storage policies:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in fix-storage-policies API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
