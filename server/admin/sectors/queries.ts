import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { SectorListParams } from "~/server/admin/sectors/schema"
import { db } from "~/services/db"

export const findAdminSectors = async (
  search: SectorListParams,
  where?: Prisma.SectorWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.SectorWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.SectorWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [sectors, sectorsTotal] = await db.$transaction([
    db.sector.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        heroText: true,
        createdAt: true,
      },
    }),
    db.sector.count({ where: { ...whereQuery, ...where } }),
  ])

  return { sectors, sectorsTotal, pageCount: Math.ceil(sectorsTotal / perPage) }
}

export const findSectorByIdForAdmin = async (id: string) => {
  return db.sector.findUnique({ where: { id } })
}
