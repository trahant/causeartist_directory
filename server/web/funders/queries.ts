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
