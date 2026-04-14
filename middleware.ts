import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getSessionFromRequest } from "~/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await getSessionFromRequest(request)

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (session.user.role !== "admin") {
    const url = new URL("/", request.url)
    url.searchParams.set("error", "FORBIDDEN")
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
