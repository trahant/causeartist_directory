import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse, type ProxyConfig } from "next/server"
import { auth } from "~/lib/auth"

export const config: ProxyConfig = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/auth/:path*", "/submit"],
}

export default async function (req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const sessionCookie = getSessionCookie(req)

  const userProtectedPaths = ["/dashboard", "/submit"]
  const adminProtectedPaths = ["/admin"]
  const allProtectedPaths = [...userProtectedPaths, ...adminProtectedPaths]

  const isAuthPage = pathname.startsWith("/auth")
  const isProtectedPage = allProtectedPaths.some(path => pathname.startsWith(path))
  const isAdminPage = adminProtectedPaths.some(path => pathname.startsWith(path))

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (!sessionCookie && isProtectedPage) {
    return NextResponse.redirect(new URL(`/auth/login?next=${pathname}${search}`, req.url))
  }

  if (sessionCookie && isAdminPage) {
    const session = await auth.api.getSession({ headers: req.headers })

    if (session?.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}
