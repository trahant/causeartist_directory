import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  blogPostManyPayload,
  blogPostOnePayload,
} from "~/server/web/blog/payloads"
import { db } from "~/services/db"

export const findBlogPosts = async ({
  where,
  orderBy,
  ...args
}: Prisma.BlogPostFindManyArgs) => {
  "use cache"

  cacheTag("blog-posts")
  cacheLife("infinite")

  return db.blogPost.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: blogPostManyPayload,
  })
}

export const findBlogPostSlugs = async ({
  where,
  orderBy,
  ...args
}: Prisma.BlogPostFindManyArgs) => {
  "use cache"

  cacheTag("blog-posts")
  cacheLife("infinite")

  return db.blogPost.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findBlogPost = async ({
  where,
  ...args
}: Prisma.BlogPostFindFirstArgs) => {
  "use cache"

  cacheTag("blog-post", `blog-post-${where?.slug}`)
  cacheLife("infinite")

  return db.blogPost.findFirst({
    ...args,
    where: { status: "published", ...where },
    select: blogPostOnePayload,
  })
}
