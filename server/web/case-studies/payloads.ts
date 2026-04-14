import type { Prisma } from "~/.generated/prisma/client"

export const caseStudyOnePayload = {
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
  canonicalUrl: true,
  ogImageUrl: true,
  ogImageAlt: true,
  metaRobots: true,
  focusKeyword: true,
  secondaryKeywords: true,
  lastReviewedAt: true,
  reviewedBy: true,
  sources: true,
  faqItems: true,
  keyTakeaways: true,
  readingTimeMinutes: true,
  contentType: true,
  company: { select: { name: true, slug: true, logoUrl: true } },
} satisfies Prisma.CaseStudySelect

export const caseStudyManyPayload = {
  id: true,
  title: true,
  slug: true,
  status: true,
  excerpt: true,
  heroImageUrl: true,
  publishedAt: true,
  updatedAt: true,
  company: { select: { name: true, slug: true, logoUrl: true } },
} satisfies Prisma.CaseStudySelect

export type CaseStudyOne = Prisma.CaseStudyGetPayload<{ select: typeof caseStudyOnePayload }>
export type CaseStudyMany = Prisma.CaseStudyGetPayload<{ select: typeof caseStudyManyPayload }>
