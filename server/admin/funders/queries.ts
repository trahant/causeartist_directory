import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { FunderListParams } from "~/server/admin/funders/schema"
import { db } from "~/services/db"

export const findAdminFunders = async (
  search: FunderListParams,
  where?: Prisma.FunderWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator, status } = search

  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.FunderWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
    status ? { status } : undefined,
  ]

  const whereQuery: Prisma.FunderWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [funders, fundersTotal] = await db.$transaction([
    db.funder.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        type: true,
        updatedAt: true,
        createdAt: true,
      },
    }),

    db.funder.count({
      where: { ...whereQuery, ...where },
    }),
  ])

  const pageCount = Math.ceil(fundersTotal / perPage)
  return { funders, fundersTotal, pageCount }
}

export const findFunderByIdForAdmin = async (id: string) => {
  return db.funder.findUnique({
    where: { id },
    include: {
      portfolio: { select: { companyId: true } },
      sectors: { select: { sectorId: true } },
      locations: { select: { locationId: true } },
      subcategories: { select: { subcategoryId: true } },
      stages: { select: { stageId: true } },
    },
  })
}

export const findTaxonomyForFunderAdmin = async () => {
  const [companies, sectors, locations, subcategories, fundingStages] = await Promise.all([
    db.company.findMany({
      where: { status: "published" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.sector.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.subcategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.fundingStage.findMany({
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])
  return { companies, sectors, locations, subcategories, fundingStages }
}
