import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  certificationManyPayload,
  certificationOnePayload,
} from "~/server/web/certifications/payloads"
import { db } from "~/services/db"

export const findCertifications = async ({
  where,
  orderBy,
  ...args
}: Prisma.CertificationFindManyArgs) => {
  "use cache"

  cacheTag("certifications")
  cacheLife("infinite")

  return db.certification.findMany({
    ...args,
    where,
    orderBy: orderBy ?? { name: "asc" },
    select: certificationManyPayload,
  })
}

export const findCertificationSlugs = async ({
  where,
  orderBy,
  ...args
}: Prisma.CertificationFindManyArgs) => {
  "use cache"

  cacheTag("certifications")
  cacheLife("infinite")

  return db.certification.findMany({
    ...args,
    where,
    orderBy: orderBy ?? { name: "asc" },
    select: { slug: true },
  })
}

export const findCertification = async ({
  where,
  ...args
}: Prisma.CertificationFindFirstArgs) => {
  "use cache"

  cacheTag("certification", `certification-${where?.slug}`)
  cacheLife("infinite")

  return db.certification.findFirst({
    ...args,
    where,
    select: certificationOnePayload,
  })
}
