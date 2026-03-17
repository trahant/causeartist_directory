import type { Metadata } from "next"
import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { Card, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
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
          <div className="grid w-full grid-cols-1 place-content-start gap-6 md:grid-cols-2 lg:grid-cols-2 lg:gap-7">
            {posts.map((post: BlogPostMany) => (
              <Card key={post.id} hover asChild>
                <Link href={`/blog/${post.slug}`}>
                  {post.heroImageUrl && (
                    <Image
                      src={post.heroImageUrl}
                      alt={post.title}
                      width={1200}
                      height={630}
                      className="-m-5 mb-0 w-[calc(100%+2.5rem)] max-w-none aspect-video object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader wrap={false}>
                    <H4 as="h3" className="text-sm leading-snug!">
                      {post.title}
                    </H4>
                  </CardHeader>
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
