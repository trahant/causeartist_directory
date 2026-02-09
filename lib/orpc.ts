import { ORPCError, os } from "@orpc/server"
import { revalidatePath, updateTag } from "next/cache"
import { getServerSession } from "~/lib/auth"
import { db } from "~/services/db"

type RevalidateOptions = {
  paths?: string[]
  tags?: string[]
}

/**
 * Queue revalidation for the given options
 * @param options - The options to queue revalidation for
 */
const revalidate = ({ paths = [], tags = [] }: RevalidateOptions) => {
  for (const path of paths) {
    revalidatePath(path)
  }

  for (const tag of tags) {
    updateTag(tag)
  }
}

// -----------------------------------------------------------------------------
// 1. Base procedure – injects db + revalidate into context
// -----------------------------------------------------------------------------
export const baseProcedure = os.use(async ({ next }) => {
  return next({
    context: { db, revalidate },
  })
})

// -----------------------------------------------------------------------------
// 2. Auth-guarded procedure
// -----------------------------------------------------------------------------
export const authedProcedure = baseProcedure.use(async ({ next }) => {
  const session = await getServerSession()

  if (!session?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "User not authenticated",
    })
  }

  return next({ context: { user: session.user } })
})

// -----------------------------------------------------------------------------
// 3. Admin-only procedure (extends auth procedure)
// -----------------------------------------------------------------------------
export const adminProcedure = authedProcedure.use(async ({ next, context }) => {
  if (context.user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: "User not authorized",
    })
  }

  return next()
})

export { revalidate }
export type { RevalidateOptions }
