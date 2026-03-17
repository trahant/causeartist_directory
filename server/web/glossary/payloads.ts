import type { Prisma } from "~/.generated/prisma/client"

export const glossaryTermOnePayload = {
  id: true,
  term: true,
  slug: true,
  status: true,
  definition: true,
  extendedContent: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GlossaryTermSelect

export const glossaryTermManyPayload = {
  id: true,
  term: true,
  slug: true,
  status: true,
  definition: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GlossaryTermSelect

export type GlossaryTermOne = Prisma.GlossaryTermGetPayload<{
  select: typeof glossaryTermOnePayload
}>
export type GlossaryTermMany = Prisma.GlossaryTermGetPayload<{
  select: typeof glossaryTermManyPayload
}>
