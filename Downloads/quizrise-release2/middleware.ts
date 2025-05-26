import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware function is required by Next.js, but we're handling auth in the layouts
// This is a minimal implementation that just passes through all requests
export function middleware(request: NextRequest) {
  // Just return the request as-is without modifying it
  return NextResponse.next()
}

// Optional: Configure which paths this middleware should run on
export const config = {
  // You can customize this to only run on specific paths if needed
  // For now, we're excluding static files, api routes, and _next paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
