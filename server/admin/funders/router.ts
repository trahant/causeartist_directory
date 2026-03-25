import { ORPCError } from "@orpc/server"
import { Prisma } from "~/.generated/prisma/client"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { findAdminFunders, findTaxonomyForFunderAdmin } from "~/server/admin/funders/queries"
import {
  funderCreateSchema,
  funderListSchema,
  funderUpdateSchema,
} from "~/server/admin/funders/schema"
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

const list = withAdmin.input(funderListSchema).handler(async ({ input }) => {
  return findAdminFunders(input)
})

const taxonomy = withAdmin.handler(async () => {
  return findTaxonomyForFunderAdmin()
})

const create = withAdmin
  .input(funderCreateSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const { name, slug: slugInput, type } = input
    const slug = await generateUniqueSlug(
      slugInput || name,
      s => db.funder.findFirst({ where: { slug: s }, select: { id: true } }).then(Boolean),
      undefined,
    )

    const funder = await db.funder.create({
      data: {
        name,
        slug,
        status: "draft",
        type: emptyToNull(type ?? undefined),
      },
    })

    revalidate({ tags: ["funders", "directory", "directory-facets", "directory-sectors"] })
    revalidate({ paths: ["/funders"] })

    return funder
  })

const remove = withAdmin.input(idsSchema).handler(async ({ input: { ids }, context: { db, revalidate } }) => {
  const deletedSlugs: string[] = []

  for (const id of ids) {
    const row = await db.funder.findUnique({ where: { id }, select: { slug: true } })
    if (!row) continue

    await db.$transaction(async tx => {
      await tx.funderEpisode.deleteMany({ where: { funderId: id } })
      await tx.companyFunder.deleteMany({ where: { funderId: id } })
      await tx.funderLocation.deleteMany({ where: { funderId: id } })
      await tx.funderSector.deleteMany({ where: { funderId: id } })
      await tx.funderSubcategory.deleteMany({ where: { funderId: id } })
      await tx.funderStage.deleteMany({ where: { funderId: id } })
      await tx.funder.delete({ where: { id } })
    })

    deletedSlugs.push(row.slug)
  }

  const tags = [
    "funders",
    "directory",
    "directory-facets",
    "directory-sectors",
    "related-funders",
    ...deletedSlugs.flatMap(s => [`funder-${s}` as const]),
  ]

  revalidate({ tags: [...new Set(tags)] })
  revalidate({ paths: ["/funders", ...deletedSlugs.map(s => `/funders/${s}`)] })

  return true
})

const update = withAdmin
  .input(funderUpdateSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const {
      id,
      sectorIds,
      locationIds,
      subcategoryIds,
      companyIds,
      stageIds,
      keyBenefitsJson,
      slug: slugInput,
      name,
      status,
      type,
      description,
      logoUrl,
      website,
      foundedYear,
      aum,
      checkSizeMin,
      checkSizeMax,
      investmentThesis,
      applicationUrl,
      linkedin,
      seoTitle,
      seoDescription,
      heroImageUrl,
    } = input

    const existing = await db.funder.findUnique({ where: { id }, select: { slug: true } })
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Funder not found" })
    }

    const slug = await generateUniqueSlug(
      slugInput || name,
      s => db.funder.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing.slug,
    )

    await db.funder.update({
      where: { id },
      data: {
        name,
        slug,
        status,
        type: emptyToNull(type ?? undefined),
        description: emptyToNull(description ?? undefined),
        logoUrl: emptyToNull(logoUrl ?? undefined),
        website: emptyToNull(website ?? undefined),
        foundedYear: foundedYear ?? null,
        aum: emptyToNull(aum ?? undefined),
        checkSizeMin: checkSizeMin ?? null,
        checkSizeMax: checkSizeMax ?? null,
        investmentThesis: emptyToNull(investmentThesis ?? undefined),
        applicationUrl: emptyToNull(applicationUrl ?? undefined),
        linkedin: emptyToNull(linkedin ?? undefined),
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
        portfolio: {
          deleteMany: {},
          create: (companyIds ?? []).map(companyId => ({ companyId })),
        },
        stages: {
          deleteMany: {},
          create: (stageIds ?? []).map(stageId => ({ stageId })),
        },
      },
    })

    const tags = [
      "funders",
      "funder",
      `funder-${existing.slug}`,
      `funder-${slug}`,
      "related-funders",
      "directory",
      "directory-facets",
      "directory-sectors",
    ]

    revalidate({ tags: [...new Set(tags)] })
    revalidate({ paths: ["/funders", `/funders/${slug}`] })

    return db.funder.findUnique({ where: { id } })
  })

export const funderRouter = {
  list,
  taxonomy,
  create,
  remove,
  update,
}
