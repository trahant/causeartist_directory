import type { Metadata } from "next"
import { getFormatter, getTranslations } from "next-intl/server"
import { cache } from "react"
import { Wrapper } from "~/components/common/wrapper"
import { BlogFeaturedPost, BlogPostIndexCard } from "~/components/web/blog/blog-post-index-cards"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { H3 } from "~/components/common/heading"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import type { BlogPostMany } from "~/server/web/blog/payloads"
import { findBlogPosts } from "~/server/web/blog/queries"

// I18n page namespace
const namespace = "pages.blog"

const postDateParts = (format: Awaited<ReturnType<typeof getFormatter>>, date: Date | null | undefined) => {
  if (!date) return { label: "" as const }
  return {
    label: format.dateTime(date, { dateStyle: "medium" }),
    iso: date.toISOString(),
  }
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
  const t = await getTranslations(namespace)
  const format = await getFormatter()

  const [featured, ...rest] = posts

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Wrapper gap="lg" className="w-full">
        {posts.length > 0 ? (
          <>
            {featured ? <BlogFeaturedPost post={featured} date={postDateParts(format, featured.publishedAt)} /> : null}

            {rest.length > 0 ? (
              <>
                <H3 as="h3" className="scroll-mt-20">
                  {t("latest_heading")}
                </H3>
                <div className="grid grid-cols-1 gap-5 w-full md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {rest.map((post: BlogPostMany) => (
                    <BlogPostIndexCard key={post.id} post={post} date={postDateParts(format, post.publishedAt)} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">No posts found.</p>
        )}
      </Wrapper>

      <StructuredData data={structuredData} />
    </>
  )
}
