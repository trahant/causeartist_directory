import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { SubcategoryListParams } from "~/server/admin/subcategories/schema"
import { db } from "~/services/db"

export const findAdminSubcategories = async (
  search: SubcategoryListParams,
  where?: Prisma.SubcategoryWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.SubcategoryWhereInput | undefined)[] = [
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.SubcategoryWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [subcategories, subcategoriesTotal] = await db.$transaction([
    db.subcategory.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    }),
    db.subcategory.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    subcategories,
    subcategoriesTotal,
    pageCount: Math.ceil(subcategoriesTotal / perPage),
  }
}

export const findSubcategoryByIdForAdmin = async (id: string) => {
  return db.subcategory.findUnique({ where: { id } })
}
