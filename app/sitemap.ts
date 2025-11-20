import type { MetadataRoute } from "next"
import { allPosts } from "content-collections"
import { siteConfig } from "~/config/site"
import { findCategorySlugs } from "~/server/web/categories/queries"
import { findTagSlugs } from "~/server/web/tags/queries"
import { findToolSlugs } from "~/server/web/tools/queries"

type SitemapId = "pages" | "tools" | "categories" | "tags" | "blog"

// Define which sitemaps to generate
export async function generateSitemaps() {
  return [
    { id: "pages" },
    { id: "tools" },
    { id: "categories" },
    { id: "tags" },
    { id: "blog" },
  ] satisfies { id: SitemapId }[]
}

// Generate sitemap based on ID
export default async function sitemap({
  id,
}: {
  id: SitemapId
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  switch (id) {
    case "pages":
      return [
        {
          url: baseUrl,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 1.0,
        },
        {
          url: `${baseUrl}/about`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        },
        {
          url: `${baseUrl}/blog`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        },
        {
          url: `${baseUrl}/categories`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        },
        {
          url: `${baseUrl}/tags`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        },
        {
          url: `${baseUrl}/advertise`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        },
        {
          url: `${baseUrl}/submit`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.6,
        },
      ]

    case "tools": {
      const tools = await findToolSlugs({})
      return tools.map((tool) => ({
        url: `${baseUrl}/${tool.slug}`,
        lastModified: tool.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }))
    }

    case "categories": {
      const categories = await findCategorySlugs({})
      return categories.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    }

    case "tags": {
      const tags = await findTagSlugs({})
      return tags.map((tag) => ({
        url: `${baseUrl}/tags/${tag.slug}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    }

    case "blog": {
      return allPosts.map((post) => ({
        url: `${baseUrl}/blog/${post._meta.path}`,
        lastModified: post.updatedAt || post.publishedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
    }

    default:
      return []
  }
}
