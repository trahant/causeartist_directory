import { z } from "zod"
import { ToolStatus, ToolTier } from "~/.generated/prisma/client"
import { withOptionalAuth } from "~/lib/orpc"
import { findCategories } from "~/server/web/categories/queries"
import { findTags } from "~/server/web/tags/queries"
import { findTools } from "~/server/web/tools/queries"

const searchItems = withOptionalAuth
  .input(z.object({ query: z.string().max(255) }))
  .handler(async ({ input: { query }, context: { user } }) => {
    const [tools, categories, tags] = await Promise.all([
      findTools({
        where: {
          status: user?.role === "admin" ? undefined : ToolStatus.Published,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { tagline: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),

      findCategories({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 10,
      }),

      findTags({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 10,
      }),
    ])

    return { tools, categories, tags }
  })

const findFeaturedTools = withOptionalAuth.handler(async () => {
  return findTools({ where: { tier: ToolTier.Premium } })
})

export const searchRouter = {
  searchItems,
  findFeaturedTools,
}
