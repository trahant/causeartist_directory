import { z } from "zod"
import { authedProcedure } from "~/lib/orpc"
import { bookmarkInputSchema } from "~/server/web/bookmarks/schema"

const check = authedProcedure
  .input(bookmarkInputSchema)
  .handler(async ({ input: { toolId }, context: { db, user } }) => {
    const bookmark = await db.bookmark.findUnique({
      where: { userId_toolId: { userId: user.id, toolId } },
      select: { id: true },
    })

    return { bookmarked: Boolean(bookmark) }
  })

const set = authedProcedure
  .input(bookmarkInputSchema.extend({ bookmarked: z.boolean() }))
  .handler(async ({ input: { toolId, bookmarked }, context: { db, user, revalidate } }) => {
    if (bookmarked) {
      await db.bookmark.upsert({
        where: { userId_toolId: { userId: user.id, toolId } },
        update: {},
        create: { userId: user.id, toolId },
      })
    } else {
      await db.bookmark.deleteMany({
        where: { userId: user.id, toolId },
      })
    }

    revalidate({
      paths: ["/dashboard/bookmarks"],
      tags: ["bookmarks", `bookmark-${toolId}`],
    })

    return { bookmarked }
  })

const remove = authedProcedure
  .input(bookmarkInputSchema)
  .handler(async ({ input: { toolId }, context: { db, user, revalidate } }) => {
    await db.bookmark.deleteMany({
      where: { userId: user.id, toolId },
    })

    revalidate({
      paths: ["/dashboard/bookmarks"],
      tags: ["bookmarks", `bookmark-${toolId}`],
    })

    return { removed: true }
  })

export const bookmarkRouter = {
  check,
  set,
  remove,
}
