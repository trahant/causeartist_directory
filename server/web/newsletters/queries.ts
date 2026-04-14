import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  newsletterManyPayload,
  newsletterOnePayload,
} from "~/server/web/newsletters/payloads"
import { db } from "~/services/db"

const newsletterSlugFilter: Prisma.BlogPostWhereInput = {
  OR: [
    { slug: { startsWith: "causeartist-weekly" } },
    { slug: { startsWith: "builder-brief" } },
    { slug: { startsWith: "monday-momentum" } },
  ],
}

export const findNewsletters = async ({
  where,
  orderBy,
  ...args
}: Prisma.BlogPostFindManyArgs) => {
  "use cache"

  cacheTag("newsletters")
  cacheLife("infinite")

  return db.blogPost.findMany({
    ...args,
    where: { status: "published", ...newsletterSlugFilter, ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: newsletterManyPayload,
  })
}

export const findNewsletterSlugs = async ({
  where,
  orderBy,
  ...args
}: Prisma.BlogPostFindManyArgs) => {
  "use cache"

  cacheTag("newsletters")
  cacheLife("infinite")

  return db.blogPost.findMany({
    ...args,
    where: { status: "published", ...newsletterSlugFilter, ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findNewsletter = async ({
  where,
  ...args
}: Prisma.BlogPostFindFirstArgs = {}) => {
  "use cache"

  cacheTag("newsletter", `newsletter-${where?.slug}`)
  cacheLife("infinite")

  return db.blogPost.findFirst({
    ...args,
    where: { status: "published", ...newsletterSlugFilter, ...where },
    select: newsletterOnePayload,
  })
}
