import { cacheLife, cacheTag } from "next/cache"
import { Prisma } from "~/.generated/prisma/client"
import { db } from "~/services/db"

const alternativeTargetWhere: Prisma.CompanyWhereInput = {
  status: "published",
  alternativeRole: { in: ["Target", "Both"] },
}

export const findAlternativeTargets = async () => {
  "use cache"

  cacheTag("alternatives")
  cacheLife("minutes")

  return db.company.findMany({
    where: alternativeTargetWhere,
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      logoUrl: true,
      alternativesSummary: true,
      updatedAt: true,
      _count: { select: { alternatives: true } },
    },
  })
}

export const findAlternativeTargetSlugs = async () => {
  "use cache"

  cacheTag("alternatives")
  cacheLife("hours")

  return db.company.findMany({
    where: alternativeTargetWhere,
    orderBy: { name: "asc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findAlternativeTarget = async ({ slug }: { slug: string }) => {
  "use cache"

  cacheTag("alternatives", `alternative-${slug}`)
  cacheLife("minutes")

  return db.company.findFirst({
    where: { ...alternativeTargetWhere, slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      logoUrl: true,
      website: true,
      alternativesSummary: true,
      updatedAt: true,
      alternatives: {
        orderBy: [{ sortOrder: "asc" }, { alternativeCompany: { name: "asc" } }],
        select: {
          sortOrder: true,
          alternativeCompany: {
            select: {
              id: true,
              slug: true,
              name: true,
              tagline: true,
              description: true,
              logoUrl: true,
              website: true,
              sectors: {
                orderBy: { sector: { name: "asc" } },
                select: {
                  sector: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      sectors: {
        select: {
          sector: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  })
}
