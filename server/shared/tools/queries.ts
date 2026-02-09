import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { ToolListParams } from "~/server/shared/tools/schema"
import { db } from "~/services/db"

export const findTools = async (search: ToolListParams, where?: Prisma.ToolWhereInput) => {
  const { name, sort, page, perPage, from, to, operator, status } = search

  // Offset to paginate the results
  const offset = (page - 1) * perPage

  // Column and order to sort by
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  // Convert the date strings to date objects
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.ToolWhereInput | undefined)[] = [
    // Filter by name
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,

    // Filter by createdAt
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,

    // Filter tasks by status
    status.length > 0 ? { status: { in: status } } : undefined,
  ]

  const whereQuery: Prisma.ToolWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  // Transaction is used to ensure both queries are executed in a single transaction
  const [tools, total] = await db.$transaction([
    db.tool.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
    }),

    db.tool.count({
      where: { ...whereQuery, ...where },
    }),
  ])

  const pageCount = Math.ceil(total / perPage)
  return { tools, total, pageCount }
}
