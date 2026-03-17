import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  caseStudyManyPayload,
  caseStudyOnePayload,
} from "~/server/web/case-studies/payloads"
import { db } from "~/services/db"

export const findCaseStudies = async ({
  where,
  orderBy,
  ...args
}: Prisma.CaseStudyFindManyArgs) => {
  "use cache"

  cacheTag("case-studies")
  cacheLife("infinite")

  return db.caseStudy.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: caseStudyManyPayload,
  })
}

export const findCaseStudySlugs = async ({
  where,
  orderBy,
  ...args
}: Prisma.CaseStudyFindManyArgs) => {
  "use cache"

  cacheTag("case-studies")
  cacheLife("infinite")

  return db.caseStudy.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findCaseStudy = async ({
  where,
  ...args
}: Prisma.CaseStudyFindFirstArgs) => {
  "use cache"

  cacheTag("case-study", `case-study-${where?.slug}`)
  cacheLife("infinite")

  return db.caseStudy.findFirst({
    ...args,
    where,
    select: caseStudyOnePayload,
  })
}
