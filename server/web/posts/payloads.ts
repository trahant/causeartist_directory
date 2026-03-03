import type { Prisma } from "~/.generated/prisma/client"

export const postAuthorPayload = {
  select: { id: true, name: true, image: true },
} satisfies Prisma.UserDefaultArgs

export const postOnePayload = {
  id: true,
  title: true,
  slug: true,
  description: true,
  content: true,
  plainText: true,
  imageUrl: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: postAuthorPayload,
} satisfies Prisma.PostSelect

export const postManyPayload = {
  id: true,
  title: true,
  slug: true,
  description: true,
  imageUrl: true,
  plainText: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.PostSelect

export type PostOne = Prisma.PostGetPayload<{ select: typeof postOnePayload }>
export type PostMany = Prisma.PostGetPayload<{ select: typeof postManyPayload }>
