import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import { funderManyPayload, funderOnePayload } from "~/server/web/funders/payloads"
import { db } from "~/services/db"

export const findFunders = async ({ where, orderBy, ...args }: Prisma.FunderFindManyArgs) => {
  "use cache"

  cacheTag("funders")
  cacheLife("infinite")

  return db.funder.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { name: "asc" },
    select: funderManyPayload,
  })
}

export const findFunderSlugs = async ({ where, orderBy, ...args }: Prisma.FunderFindManyArgs) => {
  "use cache"

  cacheTag("funders")
  cacheLife("infinite")

  return db.funder.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { name: "asc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findFunder = async ({ where, ...args }: Prisma.FunderFindFirstArgs) => {
  "use cache"

  cacheTag("funder", `funder-${where?.slug}`)
  cacheLife("infinite")

  return db.funder.findFirst({
    ...args,
    where,
    select: funderOnePayload,
  })
}

export const findRelatedFunders = async ({ slug }: { slug: string }) => {
  "use cache"

  cacheTag("related-funders")
  cacheLife("minutes")

  const source = await db.funder.findFirst({
    where: { slug, status: "published" },
    select: {
      sectors: { select: { sectorId: true } },
      stages: { select: { stageId: true } },
    },
  })

  if (!source) return []

  const sectorIds = source.sectors.map(s => s.sectorId)
  const stageIds = source.stages.map(s => s.stageId)

  const orClause: Prisma.FunderWhereInput[] = []
  if (sectorIds.length > 0) {
    orClause.push({ sectors: { some: { sectorId: { in: sectorIds } } } })
  }
  if (stageIds.length > 0) {
    orClause.push({ stages: { some: { stageId: { in: stageIds } } } })
  }

  if (orClause.length === 0) return []

  return db.funder.findMany({
    where: {
      status: "published",
      slug: { not: slug },
      OR: orClause,
    },
    select: funderManyPayload,
    orderBy: { name: "asc" },
    take: 8,
  })
}
