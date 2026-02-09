import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import { db } from "~/services/db"
import type { ReportListParams } from "./schema"

export const findReports = async (search: ReportListParams) => {
  const { message, page, perPage, sort, from, to, operator, type } = search

  // Offset to paginate the results
  const offset = (page - 1) * perPage

  // Column and order to sort by
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  // Convert the date strings to date objects
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.ReportWhereInput | undefined)[] = [
    // Filter by message
    message ? { message: { contains: message, mode: "insensitive" } } : undefined,

    // Filter by type
    type.length > 0 ? { type: { in: type } } : undefined,

    // Filter by createdAt
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const where: Prisma.ReportWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  // Transaction is used to ensure both queries are executed in a single transaction
  const [reports, reportsTotal] = await db.$transaction([
    db.report.findMany({
      where,
      orderBy,
      take: perPage,
      skip: offset,
      include: { tool: { select: { id: true, slug: true, name: true } } },
    }),

    db.report.count({
      where,
    }),
  ])

  const pageCount = Math.ceil(reportsTotal / perPage)
  return { reports, reportsTotal, pageCount }
}

export const findReportById = async (id: string) => {
  return db.report.findUnique({
    where: { id },
  })
}
