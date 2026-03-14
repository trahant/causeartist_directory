import type { Prisma } from "~/.generated/prisma/client"

export const sectorManyPayload = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.SectorSelect

export const sectorOnePayload = {
  id: true,
  name: true,
  slug: true,
  heroText: true,
  createdAt: true,
} satisfies Prisma.SectorSelect

export type SectorOne = Prisma.SectorGetPayload<{ select: typeof sectorOnePayload }>
export type SectorMany = Prisma.SectorGetPayload<{ select: typeof sectorManyPayload }>
