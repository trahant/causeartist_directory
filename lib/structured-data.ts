import type {
  AboutPage,
  AggregateRating,
  Article,
  Blog,
  BreadcrumbList,
  CollectionPage,
  FAQPage,
  Graph,
  ItemList,
  Organization,
  SoftwareApplication,
  WebPage,
  WebSite,
} from "schema-dts"
import { siteConfig } from "~/config/site"
import type { PostMany, PostOne } from "~/server/web/posts/payloads"
import type { ToolMany, ToolOne } from "~/server/web/tools/payloads"

/**
 * Converts relative URL to absolute URL
 */
const toAbsoluteUrl = (path: string): string => {
  return path.startsWith("http") ? path : `${siteConfig.url}${path}`
}

/**
 * Generates a random rating between 4.5 and 5.0
 */
export const generateRating = (seed: string): number => {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const normalized = (hash % 50) / 100 // 0 to 0.5
  return Math.round((4.5 + normalized) * 10) / 10 // 4.5 to 5.0, rounded to 1 decimal
}

/**
 * Generates a random review count between 100 and 1000
 */
export const generateReviewCount = (seed: string): number => {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const baseCount = 100 + (hash % 900) // 100 to 1000

  return baseCount
}

/**
 * Gets the organization schema reference
 */
export const getOrganization = (): Organization => ({
  "@type": "Organization",
  "@id": `${siteConfig.url}/#/schema/organization/1`,
  name: siteConfig.name,
  url: siteConfig.url,
})

/**
 * Gets the website schema reference
 */
export const getWebSite = (): WebSite => ({
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#/schema/website/1`,
  name: siteConfig.name,
  url: siteConfig.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/?q={q}`,
    query: "required name=q",
  },
})

/**
 * Generates breadcrumb list schema with automatic ID
 */
export const generateBreadcrumbs = (
  items: Array<{ title: string; url: string }>,
): BreadcrumbList => {
  const lastUrl = items[items.length - 1]?.url || ""
  const absoluteLastUrl = toAbsoluteUrl(lastUrl)
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteLastUrl}#breadcrumb`,
    itemListElement: [{ url: siteConfig.url, title: "Home" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      item: toAbsoluteUrl(item.url),
    })),
  }
}

/**
 * Generates aggregate rating schema
 */
export const generateAggregateRating = (
  tool: ToolOne | { name: string; stars?: number },
): AggregateRating => {
  const rating = generateRating(tool.name)
  const reviewCount = generateReviewCount(tool.name)

  return {
    "@type": "AggregateRating",
    ratingValue: rating.toString(),
    bestRating: "5",
    ratingCount: reviewCount,
  }
}

/**
 * Generates software application schema for a tool
 */
export const generateSoftwareApplication = (tool: ToolOne | ToolMany): SoftwareApplication => {
  const toolUrl = toAbsoluteUrl(`/${tool.slug}`)
  const schema: SoftwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${toolUrl}#software`,
    name: tool.name,
    url: toolUrl,
    description: tool.description || tool.tagline || undefined,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux, Web",
    aggregateRating: generateAggregateRating(tool),
    publisher: getOrganization(),
  }

  // Add screenshots (only on ToolOne)
  if ("screenshotUrl" in tool && tool.screenshotUrl) {
    schema.screenshot = {
      "@type": "ImageObject",
      url: tool.screenshotUrl,
      width: "1280",
      height: "720",
    }
  }

  // Add logo/icon
  if (tool.faviconUrl) {
    schema.image = tool.faviconUrl
  }

  return schema
}

/**
 * Generates collection page schema
 */
export const generateCollectionPage = (
  url: string,
  name: string,
  description?: string,
): CollectionPage => {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "CollectionPage",
    "@id": absoluteUrl,
    url: absoluteUrl,
    name,
    description,
  }
}

/**
 * Generates collection page schema with items
 */
export const generateCollectionPageWithItems = (
  url: string,
  name: string,
  description: string | null,
  items: Array<{ name: string; url: string; description?: string | null }>,
): CollectionPage => {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "CollectionPage",
    name,
    description: description || undefined,
    url: absoluteUrl,
    hasPart: items.map(item => ({
      "@type": "SoftwareApplication",
      name: item.name,
      url: toAbsoluteUrl(item.url),
      description: item.description || undefined,
    })),
  }
}

/**
 * Generates item list schema
 */
export const generateItemList = (
  items: Array<{ name: string; url: string; description?: string | null }>,
  name?: string,
): ItemList => ({
  "@type": "ItemList",
  name,
  numberOfItems: items.length,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "SoftwareApplication",
      name: item.name,
      url: toAbsoluteUrl(item.url),
      description: item.description || undefined,
    },
  })),
})

/**
 * Generates FAQ schema
 */
export const generateFAQ = (questions: Array<{ question: string; answer: string }>): FAQPage => ({
  "@type": "FAQPage",
  mainEntity: questions.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
})

/**
 * Generates article/blog posting schema
 */
export const generateArticle = (url: string, post: PostOne): Article => {
  return {
    "@type": "Article",
    headline: post.title,
    description: post.description || undefined,
    url: toAbsoluteUrl(url),
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    publisher: getOrganization(),
    author: post.author ? { "@type": "Person", name: post.author.name } : getOrganization(),
    image: post.imageUrl
      ? {
          "@type": "ImageObject",
          url: post.imageUrl,
          width: "1200",
          height: "630",
        }
      : undefined,
    inLanguage: "en",
  }
}

/**
 * Generates WebPage schema
 */
export const generateWebPage = (
  url: string,
  name: string,
  description?: string | null,
  aboutId?: string,
): WebPage => {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "WebPage",
    "@id": absoluteUrl,
    url: absoluteUrl,
    name,
    description: description || undefined,
    isPartOf: { "@id": `${siteConfig.url}/#/schema/website/1` },
    breadcrumb: { "@id": `${absoluteUrl}#breadcrumb` },
    ...(aboutId && { about: { "@id": aboutId } }),
    inLanguage: "en-US",
  }
}

/**
 * Generates blog schema (for blog listing pages)
 */
export const generateBlog = (
  url: string,
  name: string,
  description: string | undefined,
  posts: PostMany[],
): Blog => {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "Blog",
    "@id": absoluteUrl,
    url: absoluteUrl,
    name,
    description,
    blogPost: posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description || undefined,
      url: toAbsoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt?.toISOString(),
      dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    })),
  }
}

/**
 * Generates about page schema
 */
export const generateAboutPage = (url: string, name: string, description?: string): AboutPage => {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    "@type": "AboutPage",
    "@id": `${absoluteUrl}#aboutpage`,
    url: absoluteUrl,
    name,
    description,
  }
}

/**
 * Helper to create a graph of multiple schemas
 */
export const createGraph = (schemas: Array<any>): Graph => ({
  "@context": "https://schema.org",
  "@graph": schemas,
})
