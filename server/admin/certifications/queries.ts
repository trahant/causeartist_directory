import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { CertificationListParams } from "~/server/admin/certifications/schema"
import { db } from "~/services/db"

export const findAdminCertifications = async (
  search: CertificationListParams,
  where?: Prisma.CertificationWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.CertificationWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.CertificationWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [certifications, certificationsTotal] = await db.$transaction([
    db.certification.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        website: true,
        createdAt: true,
      },
    }),
    db.certification.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    certifications,
    certificationsTotal,
    pageCount: Math.ceil(certificationsTotal / perPage),
  }
}

export const findCertificationByIdForAdmin = async (id: string) => {
  return db.certification.findUnique({ where: { id } })
}
