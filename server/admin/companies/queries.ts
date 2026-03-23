import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { CompanyListParams } from "~/server/admin/companies/schema"
import { db } from "~/services/db"

export const findAdminCompanies = async (
  search: CompanyListParams,
  where?: Prisma.CompanyWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator, status } = search

  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.CompanyWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
    status ? { status } : undefined,
  ]

  const whereQuery: Prisma.CompanyWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [companies, companiesTotal] = await db.$transaction([
    db.company.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        tagline: true,
        updatedAt: true,
        createdAt: true,
      },
    }),

    db.company.count({
      where: { ...whereQuery, ...where },
    }),
  ])

  const pageCount = Math.ceil(companiesTotal / perPage)
  return { companies, companiesTotal, pageCount }
}

export const findCompanyByIdForAdmin = async (id: string) => {
  return db.company.findUnique({
    where: { id },
    include: {
      sectors: { select: { sectorId: true } },
      locations: { select: { locationId: true } },
      subcategories: { select: { subcategoryId: true } },
      certifications: { select: { certificationId: true } },
    },
  })
}

export const findTaxonomyForCompanyAdmin = async () => {
  const [sectors, locations, subcategories, certifications] = await Promise.all([
    db.sector.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.subcategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.certification.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])
  return { sectors, locations, subcategories, certifications }
}
