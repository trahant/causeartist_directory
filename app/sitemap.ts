import { allPosts } from "content-collections"
import type { MetadataRoute } from "next"
import { siteConfig } from "~/config/site"
import { findCategorySlugs } from "~/server/web/categories/queries"
import { findTagSlugs } from "~/server/web/tags/queries"
import { findToolSlugs } from "~/server/web/tools/queries"

type SitemapId = "pages" | "tools" | "categories" | "tags" | "posts"

export async function generateSitemaps() {
  return [
    { id: "pages" },
    { id: "tools" },
    { id: "categories" },
    { id: "tags" },
    { id: "posts" },
  ] satisfies { id: SitemapId }[]
}

export default async function sitemap(props: {
  id: Promise<SitemapId>
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id
  const siteUrl = siteConfig.url

  switch (id) {
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

      return pages.map(page => ({
        url: page,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }))
    }

    case "tools": {
      const tools = await findToolSlugs({})

      return tools.map(tool => ({
        url: `${siteUrl}/${tool.slug}`,
        lastModified: tool.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      }))
    }

    case "categories": {
      const categories = await findCategorySlugs({})

      return categories.map(category => ({
        url: `${siteUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    }

    case "tags": {
      const tags = await findTagSlugs({})

      return tags.map(tag => ({
        url: `${siteUrl}/tags/${tag.slug}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }))
    }

    case "posts": {
      return allPosts.map(post => ({
        url: `${siteUrl}/blog/${post._meta.path}`,
        lastModified: post.updatedAt || post.publishedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      }))
    }
  }
}
