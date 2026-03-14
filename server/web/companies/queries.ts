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
