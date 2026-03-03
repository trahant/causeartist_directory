import { setQueryParams } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { cacheLife, cacheTag } from "next/cache"
import { cache } from "react"
import RSS from "rss"
import { ToolStatus } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { db } from "~/services/db"

const findTools = cache(async () => {
  "use cache"

  cacheTag("tools")
  cacheLife("infinite")

  return db.tool.findMany({
    where: { status: ToolStatus.Published },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      name: true,
      slug: true,
      description: true,
      websiteUrl: true,
      publishedAt: true,
      categories: true,
    },
  })
})

export async function GET() {
  const t = await getTranslations()
  const tools = await findTools()

  const { url, domain, name } = siteConfig
  const rssSearchParams = { utm_source: domain, utm_medium: "rss" }

  const feed = new RSS({
    title: `${name} - Tools`,
    description: t("brand.description"),
    site_url: setQueryParams(url, rssSearchParams),
    feed_url: `${url}/rss/tools.xml`,
    copyright: `${new Date().getFullYear()} ${name}`,
    language: "en",
    ttl: 14400,
    pubDate: new Date(),
  })

  for (const tool of tools) {
    feed.item({
      guid: tool.websiteUrl,
      title: tool.name,
      url: setQueryParams(`${url}/${tool.slug}`, rssSearchParams),
      date: tool.publishedAt?.toUTCString() ?? new Date().toUTCString(),
      description: tool.description ?? "",
      categories: tool.categories?.map(({ name }) => name) || [],
    })
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=14400",
    },
  })
}
