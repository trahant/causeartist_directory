import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import { companyManyPayload, companyOnePayload } from "~/server/web/companies/payloads"
import { db } from "~/services/db"

export const findCompanies = async ({ where, orderBy, ...args }: Prisma.CompanyFindManyArgs) => {
  "use cache"

  cacheTag("companies")
  cacheLife("infinite")

  return db.company.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { name: "asc" },
    select: companyManyPayload,
  })
}

export const findCompanySlugs = async ({ where, orderBy, ...args }: Prisma.CompanyFindManyArgs) => {
  "use cache"

  cacheTag("companies")
  cacheLife("infinite")

  return db.company.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { name: "asc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findCompany = async ({ where, ...args }: Prisma.CompanyFindFirstArgs) => {
  "use cache"

  cacheTag("company", `company-${where?.slug}`)
  cacheLife("infinite")

  return db.company.findFirst({
    ...args,
    where,
    select: companyOnePayload,
  })
}

export const findRelatedCompanies = async ({ slug }: { slug: string }) => {
  "use cache"

  cacheTag("related-companies")
  cacheLife("minutes")

  const source = await db.company.findFirst({
    where: { slug, status: "published" },
    select: {
      sectors: { select: { sectorId: true } },
      subcategories: { select: { subcategoryId: true } },
    },
  })

  if (!source) return []

  const sectorIds = source.sectors.map(s => s.sectorId)
  const subcategoryIds = source.subcategories.map(s => s.subcategoryId)

  const orClause: Prisma.CompanyWhereInput[] = []
  if (sectorIds.length > 0) {
    orClause.push({ sectors: { some: { sectorId: { in: sectorIds } } } })
  }
  if (subcategoryIds.length > 0) {
    orClause.push({
      subcategories: { some: { subcategoryId: { in: subcategoryIds } } },
    })
  }

  if (orClause.length === 0) return []

  return db.company.findMany({
    where: {
      status: "published",
      slug: { not: slug },
      OR: orClause,
    },
    select: companyManyPayload,
    orderBy: { name: "asc" },
    take: 8,
  })
}
