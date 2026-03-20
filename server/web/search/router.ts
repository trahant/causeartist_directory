import { z } from "zod"
import { ToolTier } from "~/.generated/prisma/client"
import { withOptionalAuth } from "~/lib/orpc"
import { findCategories } from "~/server/web/categories/queries"
import { findTags } from "~/server/web/tags/queries"
import { findTools } from "~/server/web/tools/queries"
import { db } from "~/services/db"

const directorySearchSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
} as const

const funderSearchSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  website: true,
} as const

const searchItems = withOptionalAuth
  .input(z.object({ query: z.string().max(255) }))
  .handler(async ({ input: { query }, context: { user } }) => {
    if (user?.role === "admin") {
      const [tools, categories, tags] = await Promise.all([
        findTools({
          where: {
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

      return {
        tools,
        categories,
        tags,
        companies: [] as Awaited<
          ReturnType<
            typeof db.company.findMany<{ select: typeof directorySearchSelect }>
          >
        >,
        funders: [] as Awaited<
          ReturnType<
            typeof db.funder.findMany<{ select: typeof funderSearchSelect }>
          >
        >,
      }
    }

    const text = query.trim()
    const [companies, funders] = await Promise.all([
      db.company.findMany({
        where: {
          status: "published",
          OR: [
            { name: { contains: text, mode: "insensitive" } },
            { tagline: { contains: text, mode: "insensitive" } },
            { description: { contains: text, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: directorySearchSelect,
      }),
      db.funder.findMany({
        where: {
          status: "published",
          OR: [
            { name: { contains: text, mode: "insensitive" } },
            { description: { contains: text, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: funderSearchSelect,
      }),
    ])

    return {
      tools: [],
      categories: [],
      tags: [],
      companies,
      funders,
    }
  })

const findFeaturedTools = withOptionalAuth.handler(async () => {
  return findTools({ where: { tier: ToolTier.Premium } })
})

const findFeaturedDirectory = withOptionalAuth.handler(async () => {
  const [companies, funders] = await Promise.all([
    db.company.findMany({
      where: { status: "published" },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: directorySearchSelect,
    }),
    db.funder.findMany({
      where: { status: "published" },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: funderSearchSelect,
    }),
  ])

  return { companies, funders }
})

export const searchRouter = {
  searchItems,
  findFeaturedTools,
  findFeaturedDirectory,
}
