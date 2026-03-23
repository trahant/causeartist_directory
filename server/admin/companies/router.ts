import { ORPCError } from "@orpc/server"
import { Prisma } from "~/.generated/prisma/client"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import {
  findAdminCompanies,
  findTaxonomyForCompanyAdmin,
} from "~/server/admin/companies/queries"
import { companyListSchema, companyUpdateSchema } from "~/server/admin/companies/schema"

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

const update = withAdmin
  .input(companyUpdateSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const {
      id,
      sectorIds,
      locationIds,
      subcategoryIds,
      certificationIds,
      keyBenefitsJson,
      slug: slugInput,
      name,
      status,
      tagline,
      description,
      logoUrl,
      website,
      foundedYear,
      totalFunding,
      linkedin,
      twitter,
      founderName,
      impactModel,
      impactMetrics,
      seoTitle,
      seoDescription,
      heroImageUrl,
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

    await db.company.update({
      where: { id },
      data: {
        name,
        slug,
        status,
        tagline: emptyToNull(tagline ?? undefined),
        description: emptyToNull(description ?? undefined),
        logoUrl: emptyToNull(logoUrl ?? undefined),
        website: emptyToNull(website ?? undefined),
        foundedYear: foundedYear ?? null,
        totalFunding: emptyToNull(totalFunding ?? undefined),
        linkedin: emptyToNull(linkedin ?? undefined),
        twitter: emptyToNull(twitter ?? undefined),
        founderName: emptyToNull(founderName ?? undefined),
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
        certifications: {
          deleteMany: {},
          create: (certificationIds ?? []).map(certificationId => ({ certificationId })),
        },
      },
    })

    const tags = [
      "companies",
      "company",
      `company-${existing.slug}`,
      `company-${slug}`,
      "related-companies",
      "directory",
      "directory-facets",
      "directory-sectors",
      "certifications",
    ]

    revalidate({ tags: [...new Set(tags)] })
    revalidate({ paths: ["/companies", `/companies/${slug}`] })

    return db.company.findUnique({ where: { id } })
  })

export const companyRouter = {
  list,
  taxonomy,
  update,
}
