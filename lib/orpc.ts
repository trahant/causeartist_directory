import { ORPCError, os } from "@orpc/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { getServerSession, type Session } from "~/lib/auth"
import type { RateLimitAction } from "~/lib/rate-limiter"
import { isRateLimited } from "~/lib/rate-limiter"
import { db } from "~/services/db"

export type RevalidateOptions = {
  paths?: string[]
  tags?: string[]
}

/**
 * Queue revalidation for the given options
 * @param options - The options to queue revalidation for
 */
export const revalidate = ({ paths = [], tags = [] }: RevalidateOptions) => {
  for (const path of paths) {
    revalidatePath(path)
  }

  for (const tag of tags) {
    revalidateTag(tag, "infinite")
  }
}

// -----------------------------------------------------------------------------
// 1. Base middleware – injects db + revalidate into context
// -----------------------------------------------------------------------------
export const withBase = os.use(async ({ next }) => {
  return next({
    context: { db, revalidate },
  })
})

// -----------------------------------------------------------------------------
// 2. Optional auth middleware – injects user | null into context
// -----------------------------------------------------------------------------
export const withOptionalAuth = withBase.use(async ({ next }) => {
  const session = await getServerSession()

  return next({
    context: { user: session?.user ?? null },
  })
})

// -----------------------------------------------------------------------------
// 3. Auth-guarded middleware
// -----------------------------------------------------------------------------
export const withAuth = withBase.use(async ({ next }) => {
  const session = await getServerSession()

  if (!session?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "User not authenticated",
    })
  }

  return next({
    context: { user: session.user },
  })
})

// -----------------------------------------------------------------------------
// 4. Admin-only middleware (extends auth middleware)
// -----------------------------------------------------------------------------
export const withAdmin = withAuth.use(async ({ next, context }) => {
  if (context.user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: "User not authorized",
    })
  }

  return next()
})

// -----------------------------------------------------------------------------
// 5. Rate limit middleware (reusable via .$context)
// -----------------------------------------------------------------------------
const rateLimitMiddleware = (action: RateLimitAction, key?: string) =>
  os
    .$context<{ user?: Session["user"] | null }>()
    .middleware(async ({ next, context: { user } }) => {
      if (user?.role === "admin") {
        return next()
      }

      if (await isRateLimited(action, key, user?.id)) {
        throw new ORPCError("TOO_MANY_REQUESTS", {
          message: "Too many requests. Please try again later.",
        })
      }

      return next()
    })

// -----------------------------------------------------------------------------
// 6. Rate limit middleware factories (public and authenticated)
// -----------------------------------------------------------------------------
export const withRateLimit = (action: RateLimitAction, key?: string) => {
  return withOptionalAuth.use(rateLimitMiddleware(action, key))
}

export const withAuthRateLimit = (action: RateLimitAction, key?: string) => {
  return withAuth.use(rateLimitMiddleware(action, key))
}
