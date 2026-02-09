import { type Prisma, ToolStatus } from "~/.generated/prisma/client"
import { db } from "~/services/db"
export { findTools } from "~/server/shared/tools/queries"

export const findScheduledTools = async ({ where, ...args }: Prisma.ToolFindManyArgs = {}) => {
  return db.tool.findMany({
    ...args,
    where: { status: { in: [ToolStatus.Published, ToolStatus.Scheduled] }, ...where },
    select: { id: true, slug: true, name: true, status: true, publishedAt: true },
    orderBy: { publishedAt: "asc" },
  })
}

export const findToolList = async ({ ...args }: Prisma.ToolFindManyArgs = {}) => {
  return db.tool.findMany({
    ...args,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export const findToolById = async (id: string) => {
  return db.tool.findUnique({
    where: { id },
    include: {
      categories: { select: { id: true } },
      tags: { select: { id: true } },
    },
  })
}
