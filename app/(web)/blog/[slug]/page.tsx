import type { Metadata } from "next"
import { getFormatter, getTranslations } from "next-intl/server"
import Image from "next/image"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Prose } from "~/components/common/prose"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { Nav } from "~/components/web/nav"
import { StructuredData } from "~/components/web/structured-data"
import { TableOfContents } from "~/components/web/table-of-contents"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { blogConfig } from "~/config/blog"
import { addHeadingIdsToHtml } from "~/lib/content"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateArticleSchema } from "~/lib/schema"
import { findBlogPost, findBlogPostSlugs } from "~/server/web/blog/queries"
import type { Thing } from "schema-dts"

type Props = PageProps<"/blog/[slug]">

// Get page data
const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const post = await findBlogPost({ where: { slug, status: { in: ["draft", "published"] } } })

  if (!post) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/blog/${post.slug}`

  const data = getPageData(url, post.title, post.excerpt ?? "", {
    breadcrumbs: [
      { url: "/blog", title: t("navigation.blog") },
      { url, title: post.title },
    ],
    structuredData: [generateArticleSchema(post)] as Thing[],
  })

  return { post, ...data }
})

export const generateStaticParams = async () => {
  const posts = await findBlogPostSlugs({ where: { status: { in: ["draft", "published"] } } })
  return posts.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { post, url, metadata } = await getData(props)

  const openGraph: Metadata["openGraph"] = {
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: (post.updatedAt ?? post.publishedAt)?.toISOString(),
  }

  const robots = post.status !== "published" ? { index: false, follow: false } : undefined

  return getPageMetadata({ url, metadata: { ...metadata, openGraph, robots } })
}

export default async function (props: Props) {
  const { post, breadcrumbs, structuredData } = await getData(props)
  const t = await getTranslations()
  const format = await getFormatter()

  const content = post.content ? addHeadingIdsToHtml(post.content) : ""
  const isUpdated = post.updatedAt > (post.publishedAt ?? post.createdAt)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{post.title}</IntroTitle>
        {post.excerpt && <IntroDescription>{post.excerpt}</IntroDescription>}

        {post.updatedAt && (
          <p className="mt-4 text-sm text-muted-foreground">
            <time dateTime={post.updatedAt.toISOString()}>
              {isUpdated && `${t("posts.last_updated")}: `}
              {format.dateTime(post.updatedAt, { dateStyle: "long" })}
            </time>
          </p>
        )}
      </Intro>

      {!!post.content && (
        <>
          <Section>
            <Section.Content>
              {post.heroImageUrl && (
                <Image
                  src={post.heroImageUrl}
                  alt={post.title}
                  width={1200}
                  height={630}
                  loading="eager"
                  className="w-full h-auto aspect-video object-cover rounded-lg"
                />
              )}

              <Prose
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </Section.Content>

            <Section.Sidebar className="max-h-(--sidebar-max-height)">
              <Suspense fallback={<AdCardSkeleton />}>
                <AdCard type="BlogPost" />
              </Suspense>

              {blogConfig.tableOfContents.enabled && <TableOfContents content={content} />}
            </Section.Sidebar>
          </Section>

          <Nav title={post.title} className="self-start" />
        </>
      )}

      <StructuredData data={structuredData} />
    </>
  )
}
