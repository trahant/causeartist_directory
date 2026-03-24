import { isTruthy } from "@primoui/utils"
import { endOfDay, startOfDay } from "date-fns"
import type { Prisma } from "~/.generated/prisma/client"
import type { BlogPostListParams } from "~/server/admin/blog-posts/schema"
import { db } from "~/services/db"

export const findAdminBlogPosts = async (
  search: BlogPostListParams,
  where?: Prisma.BlogPostWhereInput,
) => {
  const { title: searchText, status, page, perPage, sort, from, to, operator } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)
  const fromDate = from ? startOfDay(new Date(from)) : undefined
  const toDate = to ? endOfDay(new Date(to)) : undefined

  const expressions: (Prisma.BlogPostWhereInput | undefined)[] = [
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

  const whereQuery: Prisma.BlogPostWhereInput = {
    [operator.toUpperCase()]: expressions.filter(isTruthy),
  }

  const [blogPosts, blogPostsTotal] = await db.$transaction([
    db.blogPost.findMany({
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
    db.blogPost.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    blogPosts,
    blogPostsTotal,
    pageCount: Math.ceil(blogPostsTotal / perPage),
  }
}

export const findBlogPostByIdForAdmin = async (id: string) => {
  return db.blogPost.findUnique({ where: { id } })
}
