import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { CaseStudyListParams } from "~/server/admin/case-studies/schema"
import { db } from "~/services/db"

export const findAdminCaseStudies = async (
  search: CaseStudyListParams,
  where?: Prisma.CaseStudyWhereInput,
) => {
  const { title: searchText, status, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.CaseStudyWhereInput | undefined)[] = [
    searchText
      ? {
          OR: [
            { title: { contains: searchText, mode: "insensitive" } },
            { slug: { contains: searchText, mode: "insensitive" } },
          ],
        }
      : undefined,
    status ? { status } : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.CaseStudyWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [caseStudies, caseStudiesTotal] = await db.$transaction([
    db.caseStudy.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "desc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    db.caseStudy.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    caseStudies,
    caseStudiesTotal,
    pageCount: Math.ceil(caseStudiesTotal / perPage),
  }
}

export const findCaseStudyByIdForAdmin = async (id: string) => {
  return db.caseStudy.findUnique({ where: { id } })
}
