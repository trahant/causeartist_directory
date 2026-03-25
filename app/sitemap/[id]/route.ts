import { NextResponse } from "next/server"
import { siteConfig } from "~/config/site"
import { findCategorySlugs } from "~/server/web/categories/queries"
import { findPostSlugs } from "~/server/web/posts/queries"
import { findTagSlugs } from "~/server/web/tags/queries"
import { findToolSlugs } from "~/server/web/tools/queries"

export const sitemaps = ["pages", "tools", "categories", "tags", "posts"] as const

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
        `${siteUrl}/about`,
        `${siteUrl}/categories`,
        `${siteUrl}/tags`,
        `${siteUrl}/blog`,
        `${siteUrl}/advertise`,
        `${siteUrl}/submit`,
        `${siteUrl}/companies`,
        `${siteUrl}/funders`,
        `${siteUrl}/podcast`,
        `${siteUrl}/case-studies`,
        `${siteUrl}/sectors`,
        `${siteUrl}/focus`,
        `${siteUrl}/certifications`,
      ]

      entries = pages.map(url => ({
        url,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }))
      break
    }

    case "tools": {
      const tools = await findToolSlugs({})

      entries = tools.map(tool => ({
        url: `${siteUrl}/${tool.slug}`,
        lastModified: tool.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      }))
      break
    }

    case "categories": {
      const categories = await findCategorySlugs({})

      entries = categories.map(category => ({
        url: `${siteUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
      break
    }

    case "tags": {
      const tags = await findTagSlugs({})

      entries = tags.map(tag => ({
        url: `${siteUrl}/tags/${tag.slug}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
      break
    }

    case "posts": {
      const posts = await findPostSlugs({})

      entries = posts.map(post => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
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
