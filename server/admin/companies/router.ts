import { ORPCError } from "@orpc/server"
import { Prisma } from "~/.generated/prisma/client"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import {
  findAdminCompanies,
  findTaxonomyForCompanyAdmin,
} from "~/server/admin/companies/queries"
import {
  companyCreateSchema,
  companyListSchema,
  companyUpdateSchema,
} from "~/server/admin/companies/schema"
import { idsSchema } from "~/server/admin/shared/schema"

function parseKeyBenefits(
  json: string | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (json == null || json.trim() === "") {
    return Prisma.JsonNull
  }
  try {
    return JSON.parse(json) as Prisma.InputJsonValue
  } catch {
    throw new ORPCError("BAD_REQUEST", { message: "Invalid keyBenefits JSON" })
  }
}

const emptyToNull = (s: string | null | undefined) => {
  if (s === undefined || s === null || s === "") return null
  return s
}

const list = withAdmin.input(companyListSchema).handler(async ({ input }) => {
  return findAdminCompanies(input)
})

const taxonomy = withAdmin.handler(async () => {
  return findTaxonomyForCompanyAdmin()
})

const create = withAdmin
  .input(companyCreateSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { name, slug: slugInput } = input
    const slug = await generateUniqueSlug(
      slugInput || name,
      s => db.company.findFirst({ where: { slug: s }, select: { id: true } }).then(Boolean),
      undefined,
    )

    const company = await db.company.create({
      data: {
        name,
        slug,
        status: "draft",
        lifecycleStatus: "Active",
      },
    })

    revalidate({
      tags: ["companies", "alternatives", "directory", "directory-facets", "directory-sectors", "certifications"],
    })
    revalidate({ paths: ["/companies", "/alternatives"] })

    return company
  })

const remove = withAdmin.input(idsSchema).handler(async ({ input: { ids }, context: { db, revalidate } }) => {
  const deletedSlugs: string[] = []

  for (const id of ids) {
    const row = await db.company.findUnique({ where: { id }, select: { slug: true } })
    if (!row) continue

    await db.$transaction(async tx => {
      await tx.companyEpisode.deleteMany({ where: { companyId: id } })
      await tx.companyFunder.deleteMany({ where: { companyId: id } })
      await tx.companyLocation.deleteMany({ where: { companyId: id } })
      await tx.companySector.deleteMany({ where: { companyId: id } })
      await tx.companySubcategory.deleteMany({ where: { companyId: id } })
      await tx.companyCertification.deleteMany({ where: { companyId: id } })
      await tx.caseStudy.updateMany({ where: { companyId: id }, data: { companyId: null } })
      await tx.company.delete({ where: { id } })
    })

    deletedSlugs.push(row.slug)
  }

  const tags = [
    "companies",
      "alternatives",
    "directory",
    "directory-facets",
    "directory-sectors",
    "certifications",
    "related-companies",
    ...deletedSlugs.flatMap(s => [`company-${s}` as const]),
  ]

  revalidate({ tags: [...new Set(tags)] })
  revalidate({
    paths: [
      "/companies",
      "/alternatives",
      ...deletedSlugs.flatMap(s => [`/companies/${s}`, `/alternatives/${s}`]),
    ],
  })

  return true
})

const update = withAdmin
  .input(companyUpdateSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const {
      id,
      sectorIds,
      locationIds,
      subcategoryIds,
      funderIds,
      certificationIds,
      alternativeCompanyIds,
      keyBenefitsJson,
      slug: slugInput,
      name,
      status,
      lifecycleStatus,
      alternativeRole,
      isTraditionalCompany,
      alternativesSummary,
      tagline,
      description,
      logoUrl,
      website,
      foundedYear,
      totalFunding,
      impactModel,
      impactMetrics,
      seoTitle,
      seoDescription,
      heroImageUrl,
      retailLocations,
    } = input

    const existing = await db.company.findUnique({ where: { id }, select: { slug: true } })
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Company not found" })
    }

    const slug = await generateUniqueSlug(
      slugInput || name,
      s => db.company.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing.slug,
    )

    const retailStores = (retailLocations ?? []).filter(r => r.label.trim() !== "" && r.city.trim() !== "")
    const cleanAlternativeCompanyIds = [...new Set((alternativeCompanyIds ?? []).filter(v => v !== id))]
    const canHaveAlternatives = alternativeRole === "Target" || alternativeRole === "Both"

    await db.company.update({
      where: { id },
      data: {
        name,
        slug,
        status,
        lifecycleStatus,
        alternativeRole,
        isTraditionalCompany,
        alternativesSummary: emptyToNull(alternativesSummary ?? undefined),
        tagline: emptyToNull(tagline ?? undefined),
        description: emptyToNull(description ?? undefined),
        logoUrl: emptyToNull(logoUrl ?? undefined),
        website: emptyToNull(website ?? undefined),
        foundedYear: foundedYear ?? null,
        totalFunding: emptyToNull(totalFunding ?? undefined),
        impactModel: emptyToNull(impactModel ?? undefined),
        impactMetrics: emptyToNull(impactMetrics ?? undefined),
        seoTitle: emptyToNull(seoTitle ?? undefined),
        seoDescription: emptyToNull(seoDescription ?? undefined),
        heroImageUrl: emptyToNull(heroImageUrl ?? undefined),
        keyBenefits: parseKeyBenefits(keyBenefitsJson ?? undefined),
        sectors: {
          deleteMany: {},
          create: (sectorIds ?? []).map(sectorId => ({ sectorId })),
        },
        locations: {
          deleteMany: {},
          create: (locationIds ?? []).map(locationId => ({ locationId })),
        },
        subcategories: {
          deleteMany: {},
          create: (subcategoryIds ?? []).map(subcategoryId => ({ subcategoryId })),
        },
        funders: {
          deleteMany: {},
          create: (funderIds ?? []).map(funderId => ({ funderId })),
        },
        certifications: {
          deleteMany: {},
          create: (certificationIds ?? []).map(certificationId => ({ certificationId })),
        },
        alternatives: {
          deleteMany: {},
          create: canHaveAlternatives
            ? cleanAlternativeCompanyIds.map((alternativeCompanyId, sortOrder) => ({
                alternativeCompanyId,
                sortOrder,
              }))
            : [],
        },
        retailLocations: {
          deleteMany: {},
          create: retailStores.map((row, index) => {
            const ccRaw = row.countryCode.trim().toUpperCase()
            const countryCode = ccRaw.length === 2 ? ccRaw : null
            return {
              label: row.label.trim(),
              addressLine1: emptyToNull(row.addressLine1 ?? undefined),
              addressLine2: emptyToNull(row.addressLine2 ?? undefined),
              city: row.city.trim(),
              region: emptyToNull(row.region ?? undefined),
              postalCode: emptyToNull(row.postalCode ?? undefined),
              countryCode,
              url: emptyToNull(row.url ?? undefined),
              sortOrder: index,
            }
          }),
        },
      },
    })

    const tags = [
      "companies",
      "alternatives",
      "company",
      `company-${existing.slug}`,
      `company-${slug}`,
      `alternative-${existing.slug}`,
      `alternative-${slug}`,
      "related-companies",
      "directory",
      "directory-facets",
      "directory-sectors",
      "certifications",
    ]

    revalidate({ tags: [...new Set(tags)] })
    revalidate({
      paths: ["/companies", "/alternatives", `/companies/${slug}`, `/alternatives/${slug}`],
    })

    return db.company.findUnique({ where: { id } })
  })

export const companyRouter = {
  list,
  taxonomy,
  create,
  remove,
  update,
}
