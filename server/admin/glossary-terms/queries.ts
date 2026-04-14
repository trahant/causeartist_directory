import { isTruthy } from "@primoui/utils"
import type { Prisma } from "~/.generated/prisma/client"
import type { GlossaryTermListParams } from "~/server/admin/glossary-terms/schema"
import { db } from "~/services/db"

export const findGlossaryTerms = async (
  search: GlossaryTermListParams,
  where?: Prisma.GlossaryTermWhereInput,
) => {
  const { term: searchText, page, perPage, sort } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  const expressions: (Prisma.GlossaryTermWhereInput | undefined)[] = [
    searchText
      ? {
          OR: [
            { term: { contains: searchText, mode: "insensitive" } },
            { slug: { contains: searchText, mode: "insensitive" } },
          ],
        }
      : undefined,
  ]

  const whereQuery: Prisma.GlossaryTermWhereInput = {
    AND: expressions.filter(isTruthy),
  }

  const [glossaryTerms, glossaryTermsTotal] = await db.$transaction([
    db.glossaryTerm.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { term: "asc" }, { id: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        term: true,
        slug: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    db.glossaryTerm.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    glossaryTerms,
    glossaryTermsTotal,
    pageCount: Math.ceil(glossaryTermsTotal / perPage),
  }
}

export const findGlossaryTerm = async (id: string) => {
  return db.glossaryTerm.findUnique({ where: { id } })
}

export const countGlossaryTerms = async (where?: Prisma.GlossaryTermWhereInput) => {
  return db.glossaryTerm.count({ where })
}
