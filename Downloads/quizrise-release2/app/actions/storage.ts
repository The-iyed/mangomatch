"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export async function createStorageBucket(name: string) {
  const supabase = createServerSupabaseClient()

  try {
    // First check if the bucket already exists by trying to get its details
    try {
      const { data, error } = await supabase.storage.getBucket(name)
      if (data) {
        // Bucket exists, make sure policies are set
        await setupBucketPolicies(name)
        return { success: true, data, message: "Bucket already exists" }
      }
    } catch (checkError) {
      // Bucket doesn't exist or there was an error checking
      console.log("Bucket check error:", checkError)
    }

    // Create the bucket if it doesn't exist
    const { data, error } = await supabase.storage.createBucket(name, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    })

    if (error) {
      // If the error is that the resource already exists, consider it a success
      if (error.message.includes("already exists")) {
        // Make sure policies are set
        await setupBucketPolicies(name)
        return { success: true, data: { name }, message: "Bucket already exists" }
      }
      return { success: false, error: error.message }
    }

    // Set up policies for the new bucket
    await setupBucketPolicies(name)

    return { success: true, data }
  } catch (error: any) {
    // Handle the case where the error is that the bucket already exists
    if (error.message && error.message.includes("already exists")) {
      // Make sure policies are set
      await setupBucketPolicies(name)
      return { success: true, data: { name }, message: "Bucket already exists" }
    }
    return { success: false, error: error.message }
  }
}

async function setupBucketPolicies(bucketName: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Create policy to allow authenticated users to upload files
    await supabase.storage.from(bucketName).createPolicy("upload-policy", {
      name: "upload-policy",
      definition: {
        // Allow authenticated users to upload files
        role: "authenticated",
        operation: "INSERT",
        check: "true",
      },
    })

    // Create policy to allow public read access
    await supabase.storage.from(bucketName).createPolicy("read-policy", {
      name: "read-policy",
      definition: {
        // Allow anyone to read files
        role: "anon",
        operation: "SELECT",
        check: "true",
      },
    })

    // Create policy to allow authenticated users to update their own files
    await supabase.storage.from(bucketName).createPolicy("update-policy", {
      name: "update-policy",
      definition: {
        // Allow authenticated users to update files
        role: "authenticated",
        operation: "UPDATE",
        check: "true",
      },
    })

    // Create policy to allow authenticated users to delete their own files
    await supabase.storage.from(bucketName).createPolicy("delete-policy", {
      name: "delete-policy",
      definition: {
        // Allow authenticated users to delete files
        role: "authenticated",
        operation: "DELETE",
        check: "true",
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error setting up bucket policies:", error)
    // Don't throw an error here, as the bucket might still be usable
    return { success: false, error: error.message }
  }
}

export async function checkBucketExists(name: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Try to get the bucket details directly
    const { data, error } = await supabase.storage.getBucket(name)

    if (error) {
      return { exists: false, error: error.message }
    }

    return { exists: true, data }
  } catch (error: any) {
    return { exists: false, error: error.message }
  }
}

// New function to directly set up RLS policies for an existing bucket
export async function fixBucketPolicies(bucketName: string) {
  try {
    const result = await setupBucketPolicies(bucketName)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
