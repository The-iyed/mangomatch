import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Global singleton instance
let globalSupabaseInstance: ReturnType<typeof createClient> | null = null

// Create a single supabase client for client-side usage
export const getClientSupabaseInstance = () => {
  // Always return the same instance for client-side usage
  if (!globalSupabaseInstance) {
    globalSupabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: "quizrise-auth-storage",
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return globalSupabaseInstance
}

// For server components and API routes
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Legacy functions for backward compatibility
export const createClientSideSupabaseClient = () => {
  console.warn("createClientSideSupabaseClient is deprecated, use getClientSupabaseInstance instead")
  return getClientSupabaseInstance()
}
