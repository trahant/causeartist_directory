import { NextResponse } from "next/server"
import { siteConfig } from "~/config/site"
import { db } from "~/services/db"
import { activeSectorsWhere } from "~/server/web/sectors/retired"

export const sitemaps = [
  "pages",
  "tools",
  "categories",
  "tags",
  "posts",
  "alternatives",
  "companies",
  "funders",
  "company-sectors",
  "funder-sectors",
  "certifications",
  "focus",
  "company-focus",
  "funder-focus",
  "company-locations",
  "funder-locations",
  "company-regions",
  "funder-regions",
  "funder-types",
  "podcast-dfg",
  "podcast-iip",
  "case-studies",
  "glossary",
  "newsletter",
] as const

type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency?: "daily" | "weekly" | "monthly"
  priority?: number
}

const buildSitemapXML = (entries: SitemapEntry[]) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  for (const entry of entries) {
    xml += "<url>"
    xml += `<loc>${entry.url}</loc>`
    if (entry.lastModified) {
      xml += `<lastmod>${entry.lastModified.toISOString().split("T")[0]}</lastmod>`
    }
    if (entry.changeFrequency) {
      xml += `<changefreq>${entry.changeFrequency}</changefreq>`
    }
    if (entry.priority) {
      xml += `<priority>${entry.priority}</priority>`
    }
    xml += "</url>"
  }

  xml += "</urlset>"
  return xml
}

export async function generateStaticParams() {
  return sitemaps.map(id => ({ id }))
}

export async function GET(_: Request, { params }: RouteContext<"/sitemap/[id]">) {
  const { id } = await params
  const siteUrl = siteConfig.url

  let entries: SitemapEntry[] = []

  switch (id) {
    case "pages": {
      const pages = [
        `${siteUrl}/`,
        `${siteUrl}/companies`,
        `${siteUrl}/funders`,
        `${siteUrl}/blog`,
        `${siteUrl}/podcast`,
        `${siteUrl}/podcast/disruptors-for-good`,
        `${siteUrl}/podcast/investing-in-impact`,
        `${siteUrl}/case-studies`,
        `${siteUrl}/glossary`,
        `${siteUrl}/certifications`,
        `${siteUrl}/newsletter`,
        `${siteUrl}/interviews`,
        `${siteUrl}/about`,
        `${siteUrl}/sectors`,
        `${siteUrl}/alternatives`,
        `${siteUrl}/categories`,
        `${siteUrl}/tags`,
        `${siteUrl}/advertise`,
        `${siteUrl}/submit`,
        `${siteUrl}/focus`,
      ]

      const staticPageMetadata: Record<string, { priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = {
        "/": { priority: 1.0, changeFrequency: "daily" },
        "/companies": { priority: 0.9, changeFrequency: "daily" },
        "/funders": { priority: 0.9, changeFrequency: "daily" },
        "/blog": { priority: 0.8, changeFrequency: "daily" },
        "/podcast": { priority: 0.8, changeFrequency: "daily" },
        "/podcast/disruptors-for-good": { priority: 0.8, changeFrequency: "daily" },
        "/podcast/investing-in-impact": { priority: 0.8, changeFrequency: "daily" },
        "/case-studies": { priority: 0.7, changeFrequency: "weekly" },
        "/glossary": { priority: 0.7, changeFrequency: "weekly" },
        "/certifications": { priority: 0.7, changeFrequency: "weekly" },
        "/newsletter": { priority: 0.6, changeFrequency: "weekly" },
        "/interviews": { priority: 0.6, changeFrequency: "weekly" },
        "/about": { priority: 0.5, changeFrequency: "monthly" },
      }

      entries = pages.map(url => {
        const path = new URL(url).pathname
        const overrides = staticPageMetadata[path]

        return {
          url,
          lastModified: new Date(),
          changeFrequency: overrides?.changeFrequency ?? "weekly",
          priority: overrides?.priority ?? 0.5,
        }
      })
      break
    }

    case "tools": {
      const tools = await db.tool.findMany({
        where: { status: "Published" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      })

      entries = tools.map(tool => ({
        url: `${siteUrl}/${tool.slug}`,
        lastModified: tool.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      }))
      break
    }

    case "categories": {
      const categories = await db.category.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, updatedAt: true },
      })

      entries = categories.map(category => ({
        url: `${siteUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "tags": {
      const tags = await db.tag.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, updatedAt: true },
      })

      entries = tags.map(tag => ({
        url: `${siteUrl}/tags/${tag.slug}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "posts": {
      const posts = await db.blogPost.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      })

      entries = posts.map(post => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "alternatives": {
      const targets = await db.company.findMany({
        where: {
          status: "published",
          alternativeRole: { in: ["Target", "Both"] },
        },
        orderBy: { name: "asc" },
        select: { slug: true, updatedAt: true },
      })

      entries = targets.map(target => ({
        url: `${siteUrl}/alternatives/${target.slug}`,
        lastModified: target.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "companies": {
      const companies = await db.company.findMany({
        where: { status: "published" },
        orderBy: { name: "asc" },
        select: { slug: true, updatedAt: true },
      })

      entries = companies.map(company => ({
        url: `${siteUrl}/companies/${company.slug}`,
        lastModified: company.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
      break
    }

    case "funders": {
      const funders = await db.funder.findMany({
        where: { status: "published" },
        orderBy: { name: "asc" },
        select: { slug: true, updatedAt: true },
      })

      entries = funders.map(funder => ({
        url: `${siteUrl}/funders/${funder.slug}`,
        lastModified: funder.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
      break
    }

    case "company-sectors": {
      const sectors = await db.sector.findMany({
        where: {
          ...activeSectorsWhere(),
          companies: { some: { company: { status: "published" } } },
        },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = sectors.map(sector => ({
        url: `${siteUrl}/companies/sector/${sector.slug}`,
        lastModified: sector.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "funder-sectors": {
      const sectors = await db.sector.findMany({
        where: {
          ...activeSectorsWhere(),
          funders: { some: { funder: { status: "published" } } },
        },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = sectors.map(sector => ({
        url: `${siteUrl}/funders/sector/${sector.slug}`,
        lastModified: sector.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "certifications": {
      const certifications = await db.certification.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = certifications.map(certification => ({
        url: `${siteUrl}/certifications/${certification.slug}`,
        lastModified: certification.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "focus": {
      const subcategories = await db.subcategory.findMany({
        where: {
          OR: [
            { companies: { some: { company: { status: "published" } } } },
            { funders: { some: { funder: { status: "published" } } } },
          ],
        },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = subcategories.map(subcategory => ({
        url: `${siteUrl}/focus/${subcategory.slug}`,
        lastModified: subcategory.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "company-focus": {
      const subcategories = await db.subcategory.findMany({
        where: {
          companies: { some: { company: { status: "published" } } },
        },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = subcategories.map(subcategory => ({
        url: `${siteUrl}/companies/focus/${subcategory.slug}`,
        lastModified: subcategory.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "funder-focus": {
      const subcategories = await db.subcategory.findMany({
        where: {
          funders: { some: { funder: { status: "published" } } },
        },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = subcategories.map(subcategory => ({
        url: `${siteUrl}/funders/focus/${subcategory.slug}`,
        lastModified: subcategory.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "company-locations": {
      const locations = await db.location.findMany({
        where: { companies: { some: { company: { status: "published" } } } },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = locations.map(location => ({
        url: `${siteUrl}/companies/location/${location.slug}`,
        lastModified: location.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "funder-locations": {
      const locations = await db.location.findMany({
        where: { funders: { some: { funder: { status: "published" } } } },
        orderBy: { name: "asc" },
        select: { slug: true, createdAt: true },
      })

      entries = locations.map(location => ({
        url: `${siteUrl}/funders/location/${location.slug}`,
        lastModified: location.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "company-regions": {
      const locations = await db.location.findMany({
        where: {
          region: { not: null },
          companies: { some: { company: { status: "published" } } },
        },
        select: { region: true, createdAt: true },
      })

      const regionLastModified = new Map<string, Date>()
      for (const location of locations) {
        if (!location.region) continue
        const current = regionLastModified.get(location.region)
        if (!current || location.createdAt > current) {
          regionLastModified.set(location.region, location.createdAt)
        }
      }

      entries = Array.from(regionLastModified.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([region, lastModified]) => ({
          url: `${siteUrl}/companies/region/${region}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.6,
        }))
      break
    }

    case "funder-regions": {
      const locations = await db.location.findMany({
        where: {
          region: { not: null },
          funders: { some: { funder: { status: "published" } } },
        },
        select: { region: true, createdAt: true },
      })

      const regionLastModified = new Map<string, Date>()
      for (const location of locations) {
        if (!location.region) continue
        const current = regionLastModified.get(location.region)
        if (!current || location.createdAt > current) {
          regionLastModified.set(location.region, location.createdAt)
        }
      }

      entries = Array.from(regionLastModified.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([region, lastModified]) => ({
          url: `${siteUrl}/funders/region/${region}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.6,
        }))
      break
    }

    case "funder-types": {
      const grouped = await db.funder.groupBy({
        by: ["type"],
        where: {
          status: "published",
          type: { not: null },
        },
        _max: { updatedAt: true },
      })

      entries = grouped
        .filter((group): group is { type: string; _max: { updatedAt: Date | null } } =>
          Boolean(group.type && group.type.length > 0),
        )
        .map(group => ({
          url: `${siteUrl}/funders/type/${group.type}`,
          lastModified: group._max.updatedAt ?? new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        }))
      break
    }

    case "podcast-dfg": {
      const episodes = await db.podcastEpisode.findMany({
        where: { status: "published", show: "dfg" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      })

      entries = episodes.map(episode => ({
        url: `${siteUrl}/podcast/disruptors-for-good/${episode.slug}`,
        lastModified: episode.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "podcast-iip": {
      const episodes = await db.podcastEpisode.findMany({
        where: { status: "published", show: "iip" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      })

      entries = episodes.map(episode => ({
        url: `${siteUrl}/podcast/investing-in-impact/${episode.slug}`,
        lastModified: episode.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "case-studies": {
      const caseStudies = await db.caseStudy.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      })

      entries = caseStudies.map(caseStudy => ({
        url: `${siteUrl}/case-studies/${caseStudy.slug}`,
        lastModified: caseStudy.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "glossary": {
      const terms = await db.glossaryTerm.findMany({
        where: { status: "published" },
        orderBy: { term: "asc" },
        select: { slug: true, updatedAt: true },
      })

      entries = terms.map(term => ({
        url: `${siteUrl}/glossary/${term.slug}`,
        lastModified: term.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "newsletter": {
      const newsletters = await db.blogPost.findMany({
        where: {
          status: "published",
          OR: [
            { slug: { startsWith: "causeartist-weekly" } },
            { slug: { startsWith: "builder-brief" } },
            { slug: { startsWith: "monday-momentum" } },
          ],
        },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      })

      entries = newsletters.map(newsletter => ({
        url: `${siteUrl}/newsletter/${newsletter.slug}`,
        lastModified: newsletter.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      }))
      break
    }
  }

  const xml = buildSitemapXML(entries)

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": Buffer.byteLength(xml).toString(),
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600",
    },
  })
}
