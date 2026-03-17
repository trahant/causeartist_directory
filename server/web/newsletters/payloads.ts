import type { Prisma } from "~/.generated/prisma/client"

export const newsletterOnePayload = {
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

export const newsletterManyPayload = {
  id: true,
  title: true,
  slug: true,
  status: true,
  excerpt: true,
  heroImageUrl: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect

export type NewsletterOne = Prisma.BlogPostGetPayload<{
  select: typeof newsletterOnePayload
}>
export type NewsletterMany = Prisma.BlogPostGetPayload<{
  select: typeof newsletterManyPayload
}>
