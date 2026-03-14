import type { Prisma } from "~/.generated/prisma/client"

export const locationManyPayload = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.LocationSelect

export const locationOnePayload = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
} satisfies Prisma.LocationSelect

export type LocationOne = Prisma.LocationGetPayload<{ select: typeof locationOnePayload }>
export type LocationMany = Prisma.LocationGetPayload<{ select: typeof locationManyPayload }>
