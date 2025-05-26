import { createServerSupabaseClient } from "@/lib/supabase"

export default async function SeedUserPage() {
  const supabase = createServerSupabaseClient()

  try {
    // Delete all existing users (except those with active sessions)
    const { data: sessions } = await supabase.auth.admin.listUsers()
    const activeUserIds = sessions.users.map((user) => user.id)

    // Delete users from profiles table
    if (activeUserIds.length > 0) {
      await supabase
        .from("profiles")
        .delete()
        .not("id", "in", `(${activeUserIds.map((id) => `'${id}'`).join(",")})`)
    } else {
      await supabase.from("profiles").delete().neq("id", "none")
    }

    // Create admin user
    const adminEmail = "admin@quizrise.com"
    const adminPassword = "admin123"

    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Admin User",
      },
    })

    if (adminError) {
      throw new Error(`Error creating admin user: ${adminError.message}`)
    }

    // Update admin role
    await supabase.from("profiles").update({ role: "admin" }).eq("id", adminUser.user.id)

    // Create regular user
    const userEmail = "user@quizrise.com"
    const userPassword = "user123"

    const { error: userError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Regular User",
      },
    })

    if (userError) {
      throw new Error(`Error creating regular user: ${userError.message}`)
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold">Users Seeded Successfully</h1>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h2 className="font-semibold">Admin User</h2>
              <p>Email: {adminEmail}</p>
              <p>Password: {adminPassword}</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <h2 className="font-semibold">Regular User</h2>
              <p>Email: {userEmail}</p>
              <p>Password: {userPassword}</p>
            </div>
            <div className="mt-6">
              <a href="/login" className="text-primary hover:underline">
                Go to Login Page
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-destructive">Error</h1>
          <p>{error.message || "An error occurred while seeding users"}</p>
          <div className="mt-6">
            <a href="/" className="text-primary hover:underline">
              Go to Home Page
            </a>
          </div>
        </div>
      </div>
    )
  }
}
