import type { Prisma } from "~/.generated/prisma/client"

/** Sectors removed from public directory UI and sector collection URLs. */
const RETIRED_SECTOR_SLUGS = ["social-enterprise"] as const

export function isRetiredSectorSlug(slug: string): boolean {
  return (RETIRED_SECTOR_SLUGS as readonly string[]).includes(slug)
}

export function activeSectorsWhere(): Prisma.SectorWhereInput {
  return { slug: { notIn: [...RETIRED_SECTOR_SLUGS] } }
}
