import type { Prisma } from "~/.generated/prisma/client"

export const blogPostOnePayload = {
  id: true,
  title: true,
  slug: true,
  status: true,
  excerpt: true,
  content: true,
  heroImageUrl: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect

export const blogPostManyPayload = {
  id: true,
  title: true,
  slug: true,
  status: true,
  excerpt: true,
  heroImageUrl: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect

export type BlogPostOne = Prisma.BlogPostGetPayload<{
  select: typeof blogPostOnePayload
}>
export type BlogPostMany = Prisma.BlogPostGetPayload<{
  select: typeof blogPostManyPayload
}>
