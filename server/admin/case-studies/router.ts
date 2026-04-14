import { Prisma } from "~/.generated/prisma/client"
import { ORPCError } from "@orpc/server"
import { withAdmin } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import {
  findAdminCaseStudies,
  findCaseStudyByIdForAdmin,
} from "~/server/admin/case-studies/queries"
import {
  caseStudyListSchema,
  caseStudyUpsertSchema,
} from "~/server/admin/case-studies/schema"
import { parseArticleSeoJsonForPersist, resolveReadingTimeMinutes } from "~/server/admin/shared/article-seo-persist"
import { idSchema, idsSchema } from "~/server/admin/shared/schema"

const emptyToNull = (s: string | null | undefined) => {
  const t = s?.trim()
  return t || null
}

function optionalAbsoluteUrl(s: string | null | undefined): string | null {
  const t = emptyToNull(s)
  if (!t) return null
  try {
    const u = new URL(t)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new ORPCError("BAD_REQUEST", { message: "Canonical URL must be http(s)" })
    }
    return u.toString()
  } catch (e) {
    if (e instanceof ORPCError) throw e
    throw new ORPCError("BAD_REQUEST", { message: "Invalid canonical URL" })
  }
}

const lookupCompanies = withAdmin.handler(async ({ context: { db } }) => {
  return db.company.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })
})

const list = withAdmin.input(caseStudyListSchema).handler(async ({ input }) => {
  return findAdminCaseStudies(input)
})

const upsert = withAdmin
  .input(caseStudyUpsertSchema)
  .handler(async ({ input, context: { db, revalidate } }) => {
    const {
      id,
      title,
      slug: slugInput,
      status,
      excerpt,
      content,
      heroImageUrl,
      seoTitle,
      seoDescription,
      publishedAt,
      companyId,
      canonicalUrl,
      ogImageUrl,
      ogImageAlt,
      metaRobots,
      focusKeyword,
      lastReviewedAt,
      reviewedBy,
      readingTimeMinutes,
      contentType,
      secondaryKeywordsJson,
      sourcesJson,
      faqItemsJson,
      keyTakeawaysJson,
    } = input

    let jsonFields: ReturnType<typeof parseArticleSeoJsonForPersist>
    try {
      jsonFields = parseArticleSeoJsonForPersist({
        secondaryKeywordsJson,
        sourcesJson,
        faqItemsJson,
        keyTakeawaysJson,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid JSON"
      throw new ORPCError("BAD_REQUEST", { message })
    }

    const readingTime = resolveReadingTimeMinutes(readingTimeMinutes ?? undefined, content ?? undefined)

    const existing = await db.caseStudy.findUnique({ where: { id }, select: { slug: true } })
    const oldSlug = existing?.slug

    const slug = await generateUniqueSlug(
      slugInput || title,
      s =>
        db.caseStudy.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }).then(Boolean),
      existing?.slug,
    )

    if (companyId) {
      const company = await db.company.findUnique({ where: { id: companyId }, select: { id: true } })
      if (!company) {
        throw new ORPCError("BAD_REQUEST", { message: "Company not found" })
      }
    }

    const jsonOrDbNull = (v: Prisma.InputJsonValue | null) =>
      v === null ? Prisma.DbNull : v

    const seoPayload = {
      canonicalUrl: optionalAbsoluteUrl(canonicalUrl ?? undefined),
      ogImageUrl: emptyToNull(ogImageUrl),
      ogImageAlt: emptyToNull(ogImageAlt),
      metaRobots: emptyToNull(metaRobots),
      focusKeyword: emptyToNull(focusKeyword),
      secondaryKeywords: jsonOrDbNull(jsonFields.secondaryKeywords),
      lastReviewedAt: lastReviewedAt ?? null,
      reviewedBy: emptyToNull(reviewedBy),
      sources: jsonOrDbNull(jsonFields.sources),
      faqItems: jsonOrDbNull(jsonFields.faqItems),
      keyTakeaways: jsonOrDbNull(jsonFields.keyTakeaways),
      readingTimeMinutes: readingTime,
      contentType: emptyToNull(contentType),
    }

    await db.caseStudy.upsert({
      where: { id },
      create: {
        id,
        title,
        slug,
        status,
        excerpt: excerpt ?? null,
        content: content ?? null,
        heroImageUrl: heroImageUrl ?? null,
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        publishedAt: publishedAt ?? null,
        companyId: companyId ?? null,
        ...seoPayload,
      } satisfies Prisma.CaseStudyUncheckedCreateInput,
      update: {
        title,
        slug,
        status,
        excerpt: excerpt ?? null,
        content: content ?? null,
        heroImageUrl: heroImageUrl ?? null,
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        publishedAt: publishedAt ?? null,
        ...seoPayload,
        ...(companyId !== undefined ? { companyId } : {}),
      } satisfies Prisma.CaseStudyUncheckedUpdateInput,
    })

    const tags = ["case-studies", "case-study", `case-study-${slug}`]
    if (oldSlug && oldSlug !== slug) {
      tags.push(`case-study-${oldSlug}`)
    }
    revalidate({ tags: [...new Set(tags)] })
    revalidate({ paths: ["/case-studies", `/case-studies/${slug}`] })
    if (oldSlug && oldSlug !== slug) {
      revalidate({ paths: [`/case-studies/${oldSlug}`] })
    }

    return db.caseStudy.findUnique({ where: { id } })
  })

const remove = withAdmin
  .input(idsSchema)
  .handler(async ({ input: { ids }, context: { db, revalidate } }) => {
    const rows = await db.caseStudy.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    })
    await db.caseStudy.deleteMany({ where: { id: { in: ids } } })
    const tags = new Set<string>(["case-studies"])
    for (const r of rows) {
      tags.add(`case-study-${r.slug}`)
    }
    revalidate({ tags: [...tags] })
    revalidate({
      paths: ["/case-studies", ...rows.map(r => `/case-studies/${r.slug}`)],
    })
    return true
  })

const get = withAdmin.input(idSchema).handler(async ({ input: { id } }) => {
  const row = await findCaseStudyByIdForAdmin(id)
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Case study not found" })
  return row
})

export const caseStudyRouter = {
  lookupCompanies,
  list,
  get,
  upsert,
  remove,
}
