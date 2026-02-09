import { getRandomElement } from "@primoui/utils"
import { cacheLife, cacheTag } from "next/cache"
import { type Prisma, ToolStatus } from "~/.generated/prisma/client"
import { toolManyPayload, toolOnePayload } from "~/server/web/tools/payloads"
import type { ToolFilterParams } from "~/server/web/tools/schema"
import { db } from "~/services/db"

export const searchTools = async (search: ToolFilterParams, where?: Prisma.ToolWhereInput) => {
  "use cache"

  cacheTag("tools")
  cacheLife("infinite")

  const { q, category, sort, page, perPage } = search
  const skip = (page - 1) * perPage
  const take = perPage
  const [sortBy, sortOrder] = sort.split(".")

  const whereQuery: Prisma.ToolWhereInput = {
    status: ToolStatus.Published,
    ...(category && { categories: { some: { slug: category } } }),
  }

  if (q) {
    whereQuery.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  // Query Premium tools first, then others by createdAt (Standard and Free equal)
  const [tools, total] = await db.$transaction([
    db.tool.findMany({
      orderBy: sortBy ? { [sortBy]: sortOrder } : [{ tierPriority: "asc" }, { createdAt: "desc" }],
      where: { ...whereQuery, ...where },
      select: toolManyPayload,
      take,
      skip,
    }),

    db.tool.count({
      where: { ...whereQuery, ...where },
    }),
  ])

  return { tools, total, page, perPage }
}

export const findRelatedTools = async ({
  where,
  slug,
  ...args
}: Prisma.ToolFindManyArgs & { slug: string }) => {
  "use cache"

  cacheTag("related-tools")
  cacheLife("minutes")

  const relatedWhereClause = {
    ...where,
    AND: [
      { status: ToolStatus.Published },
      { slug: { not: slug } },
      { categories: { some: { tools: { some: { slug } } } } },
    ],
  } satisfies Prisma.ToolWhereInput

  const take = 3
  const itemCount = await db.tool.count({ where: relatedWhereClause })
  const skip = Math.max(0, Math.floor(Math.random() * itemCount) - take)
  const properties = ["id", "name"] satisfies (keyof Prisma.ToolOrderByWithRelationInput)[]
  const orderBy = getRandomElement(properties)
  const orderDir = getRandomElement(["asc", "desc"] as const)

  return db.tool.findMany({
    ...args,
    where: relatedWhereClause,
    select: toolManyPayload,
    orderBy: { [orderBy]: orderDir },
    take,
    skip,
  })
}

export const findTools = async ({ where, orderBy, ...args }: Prisma.ToolFindManyArgs) => {
  "use cache"

  cacheTag("tools")
  cacheLife("infinite")

  return db.tool.findMany({
    ...args,
    where: { status: ToolStatus.Published, ...where },
    orderBy: orderBy ?? [{ tierPriority: "asc" }, { createdAt: "desc" }],
    select: toolManyPayload,
  })
}

export const findToolSlugs = async ({ where, orderBy, ...args }: Prisma.ToolFindManyArgs) => {
  "use cache"

  cacheTag("tools")
  cacheLife("infinite")

  return db.tool.findMany({
    ...args,
    orderBy: orderBy ?? { name: "asc" },
    where: { status: ToolStatus.Published, ...where },
    select: { slug: true, updatedAt: true },
  })
}

export const countSubmittedTools = async ({ where, ...args }: Prisma.ToolCountArgs) => {
  return db.tool.count({
    ...args,
    where: {
      status: { notIn: [ToolStatus.Published] },
      submitterEmail: { not: null },
      ...where,
    },
  })
}

export const findTool = async ({ where, ...args }: Prisma.ToolFindFirstArgs = {}) => {
  "use cache"

  cacheTag("tool", `tool-${where?.slug}`)
  cacheLife("infinite")

  return db.tool.findFirst({
    ...args,
    where,
    select: toolOnePayload,
  })
}
