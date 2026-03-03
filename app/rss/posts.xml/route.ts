import { setQueryParams } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { cacheLife, cacheTag } from "next/cache"
import { cache } from "react"
import RSS from "rss"
import { PostStatus } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { db } from "~/services/db"

const findPosts = cache(async () => {
  "use cache"

  cacheTag("posts")
  cacheLife("infinite")

  return db.post.findMany({
    where: {
      status: PostStatus.Published,
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      title: true,
      slug: true,
      description: true,
      plainText: true,
      publishedAt: true,
      createdAt: true,
    },
  })
})

export async function GET() {
  const t = await getTranslations()
  const posts = await findPosts()

  const { url, domain, name } = siteConfig
  const rssSearchParams = { utm_source: domain, utm_medium: "rss" }

  const feed = new RSS({
    title: `${name} - Blog`,
    description: t("brand.description"),
    site_url: setQueryParams(url, rssSearchParams),
    feed_url: `${url}/rss/posts.xml`,
    copyright: `${new Date().getFullYear()} ${name}`,
    language: "en",
    ttl: 14400,
    pubDate: new Date(),
  })

  for (const post of posts) {
    const description = post.description || post.plainText.slice(0, 300)
    const postUrl = setQueryParams(`${url}/blog/${post.slug}`, rssSearchParams)

    feed.item({
      guid: postUrl,
      title: post.title,
      url: postUrl,
      date: post.publishedAt?.toUTCString() ?? post.createdAt.toUTCString(),
      description,
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
