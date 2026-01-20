import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { CategoryTableSchema } from "~/server/admin/categories/schema"
import { db } from "~/services/db"

export const findCategories = async (
  search: CategoryTableSchema,
  where?: Prisma.CategoryWhereInput,
) => {
  const { name, page, perPage, sort, from, to, operator } = search

  // Offset to paginate the results
  const offset = (page - 1) * perPage

  // Column and order to sort by
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  // Convert the date strings to Date objects and adjust the range
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.CategoryWhereInput | undefined)[] = [
    // Filter by name
    name ? { name: { contains: name, mode: "insensitive" } } : undefined,

    // Filter by createdAt
    fromDate || toDate ? { createdAt: { gte: fromDate, lte: toDate } } : undefined,
  ]

  const whereQuery: Prisma.CategoryWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  // Transaction is used to ensure both queries are executed in a single transaction
  const [categories, categoriesTotal] = await db.$transaction([
    db.category.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "asc" }],
      take: perPage,
      skip: offset,
      include: { _count: { select: { tools: true } } },
    }),

    db.category.count({
      where: { ...whereQuery, ...where },
    }),
  ])

  const pageCount = Math.ceil(categoriesTotal / perPage)
  return { categories, categoriesTotal, pageCount }
}

export const findCategoryList = async ({ ...args }: Prisma.CategoryFindManyArgs = {}) => {
  return db.category.findMany({
    ...args,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export const findCategoryBySlug = async (slug: string) => {
  return db.category.findUnique({
    where: { slug },
    include: {
      tools: { select: { id: true } },
    },
  })
}

export const findCategoryById = async (id: string) => {
  return db.category.findUnique({
    where: { id },
    include: {
      tools: { select: { id: true } },
    },
  })
}
