import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { AdListParams } from "~/server/admin/ads/schema"
import { db } from "~/services/db"

export const findAds = async (search: AdListParams, where?: Prisma.AdWhereInput) => {
  const { name, type, page, perPage, sort, from, to, operator } = search

  // Offset to paginate the results
  const offset = (page - 1) * perPage

  // Column and order to sort by
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  // Convert the date strings to Date objects and adjust the range
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.AdWhereInput | undefined)[] = [
    // Filter by name
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,

    // Filter by type
    type.length > 0 ? { type: { in: type } } : undefined,

    // Filter by createdAt
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.AdWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  // Transaction is used to ensure both queries are executed in a single transaction
  const [ads, adsTotal] = await db.$transaction([
    db.ad.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "desc" }],
      take: perPage,
      skip: offset,
    }),

    db.ad.count({
      where: { ...whereQuery, ...where },
    }),
  ])

  const pageCount = Math.ceil(adsTotal / perPage)
  return { ads, adsTotal, pageCount }
}

export const findAdById = async (id: string) => {
  return db.ad.findUnique({
    where: { id },
  })
}
