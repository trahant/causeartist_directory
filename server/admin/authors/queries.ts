import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { AuthorListParams } from "~/server/admin/authors/schema"
import { db } from "~/services/db"

export const findAdminAuthors = async (
  search: AuthorListParams,
  where?: Prisma.AuthorWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.AuthorWhereInput | undefined)[] = [
    name
      ? {
          OR: [
            { name: { contains: name, mode: "insensitive" } },
            { slug: { contains: name, mode: "insensitive" } },
          ],
        }
      : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.AuthorWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [authors, authorsTotal] = await db.$transaction([
    db.author.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: { id: true, name: true, slug: true, createdAt: true },
    }),
    db.author.count({ where: { ...whereQuery, ...where } }),
  ])

  return { authors, authorsTotal, pageCount: Math.ceil(authorsTotal / perPage) }
}

export const findAuthorByIdForAdmin = async (id: string) => {
  return db.author.findUnique({ where: { id } })
}
