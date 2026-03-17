import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  glossaryTermManyPayload,
  glossaryTermOnePayload,
} from "~/server/web/glossary/payloads"
import { db } from "~/services/db"

export const findGlossaryTerms = async ({
  where,
  orderBy,
  ...args
}: Prisma.GlossaryTermFindManyArgs) => {
  "use cache"

  cacheTag("glossary-terms")
  cacheLife("infinite")

  return db.glossaryTerm.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { term: "asc" },
    select: glossaryTermManyPayload,
  })
}

export const findGlossaryTermSlugs = async ({
  where,
  orderBy,
  ...args
}: Prisma.GlossaryTermFindManyArgs) => {
  "use cache"

  cacheTag("glossary-terms")
  cacheLife("infinite")

  return db.glossaryTerm.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { term: "asc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findGlossaryTerm = async ({
  where,
  ...args
}: Prisma.GlossaryTermFindFirstArgs) => {
  "use cache"

  cacheTag("glossary-term", `glossary-term-${where?.slug}`)
  cacheLife("infinite")

  return db.glossaryTerm.findFirst({
    ...args,
    where,
    select: glossaryTermOnePayload,
  })
}
