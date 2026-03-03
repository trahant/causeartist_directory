import { cacheLife, cacheTag } from "next/cache"
import { type Prisma, PostStatus } from "~/.generated/prisma/client"
import { postManyPayload, postOnePayload } from "~/server/web/posts/payloads"
import { db } from "~/services/db"

export const findPosts = async ({ where, orderBy, ...args }: Prisma.PostFindManyArgs = {}) => {
  "use cache"

  cacheTag("posts")
  cacheLife("infinite")

  return db.post.findMany({
    ...args,
    where: { status: PostStatus.Published, ...where },
    select: postManyPayload,
    orderBy: orderBy ?? { publishedAt: "desc" },
  })
}

export const findPostSlugs = async ({ where, orderBy, ...args }: Prisma.PostFindManyArgs = {}) => {
  "use cache"

  cacheTag("posts")
  cacheLife("infinite")

  return db.post.findMany({
    ...args,
    where: { status: PostStatus.Published, ...where },
    select: { slug: true, updatedAt: true },
    orderBy: orderBy ?? { publishedAt: "desc" },
  })
}

export const findPost = async ({ where, ...args }: Prisma.PostFindFirstArgs = {}) => {
  "use cache"

  cacheTag("post", `post-${where?.slug}`)
  cacheLife("infinite")

  return db.post.findFirst({
    ...args,
    where: { ...where },
    select: postOnePayload,
  })
}
