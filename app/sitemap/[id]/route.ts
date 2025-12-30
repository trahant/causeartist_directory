import { allPosts } from "content-collections"
import { NextResponse } from "next/server"
import { siteConfig } from "~/config/site"
import { findCategorySlugs } from "~/server/web/categories/queries"
import { findTagSlugs } from "~/server/web/tags/queries"
import { findToolSlugs } from "~/server/web/tools/queries"

type SitemapId = "pages" | "tools" | "categories" | "tags" | "posts"

export const sitemaps: SitemapId[] = ["pages", "tools", "categories", "tags", "posts"]

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
      xml += `<lastmod>${entry.lastModified.toISOString()}</lastmod>`
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

export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const siteUrl = siteConfig.url

  if (!sitemaps.includes(id as SitemapId)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  let entries: SitemapEntry[] = []

  switch (id as SitemapId) {
    case "pages": {
      const pages = [
        `${siteUrl}/`,
        `${siteUrl}/about`,
        `${siteUrl}/posts`,
        `${siteUrl}/categories`,
        `${siteUrl}/tags`,
        `${siteUrl}/blog`,
        `${siteUrl}/advertise`,
        `${siteUrl}/submit`,
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
      entries = allPosts.map(post => ({
        url: `${siteUrl}/blog/${post._meta.path}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.publishedAt),
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
    },
  })
}
