import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { LocationListParams } from "~/server/admin/locations/schema"
import { db } from "~/services/db"

export const findAdminLocations = async (
  search: LocationListParams,
  where?: Prisma.LocationWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.LocationWhereInput | undefined)[] = [
    name
      ? {
          OR: [
            { name: { contains: name, mode: "insensitive" } },
            { country: { contains: name, mode: "insensitive" } },
            { region: { contains: name, mode: "insensitive" } },
          ],
        }
      : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.LocationWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [locations, locationsTotal] = await db.$transaction([
    db.location.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        region: true,
        countryCode: true,
        createdAt: true,
      },
    }),
    db.location.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    locations,
    locationsTotal,
    pageCount: Math.ceil(locationsTotal / perPage),
  }
}

export const findLocationByIdForAdmin = async (id: string) => {
  return db.location.findUnique({ where: { id } })
}
