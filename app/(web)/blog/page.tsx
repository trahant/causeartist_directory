import type { Metadata } from "next"
import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import type { BlogPostMany } from "~/server/web/blog/payloads"
import { findBlogPosts } from "~/server/web/blog/queries"

// I18n page namespace
const namespace = "pages.blog"

const formatDate = (date: Date | null | undefined) => {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Get page data
const getData = cache(async () => {
  const posts = await findBlogPosts({ where: { status: { in: ["draft", "published"] } } })

  const t = await getTranslations()
  const url = "/blog"
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`, { siteName: siteConfig.name })

  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: t("navigation.blog") }],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { posts, ...data }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url, metadata } = await getData()
  return getPageMetadata({ url, metadata })
}

export default async function () {
  const { posts, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {posts.map((post: BlogPostMany) => (
              <Card key={post.id} asChild>
                <Link href={`/blog/${post.slug}`}>
                  <CardHeader wrap={false}>
                    <span className="font-semibold text-sm line-clamp-2">{post.title}</span>
                  </CardHeader>
                  <CardDescription>{post.excerpt}</CardDescription>
                  <CardFooter>
                    <span>{formatDate(post.publishedAt)}</span>
                  </CardFooter>
                </Link>
              </Card>
            ))}
          </div>

          {posts.length === 0 && (
            <p className="text-muted-foreground">No posts found.</p>
          )}
        </Section.Content>

        <Section.Sidebar className="max-h-(--sidebar-max-height)">
          <Suspense fallback={<AdCardSkeleton />}>
            <AdCard type="BlogPost" />
          </Suspense>
          <Suspense>
            <FeaturedToolsIcons />
          </Suspense>
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
