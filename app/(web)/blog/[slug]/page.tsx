import { getReadTime } from "@primoui/utils"
import type { Metadata } from "next"
import { getFormatter, getTranslations } from "next-intl/server"
import Image from "next/image"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { extractHeadingsFromMarkdown, Markdown } from "~/components/web/markdown"
import { Nav } from "~/components/web/nav"
import { PostPreviewAlert } from "~/components/web/posts/post-preview-alert"
import { StructuredData } from "~/components/web/structured-data"
import { TableOfContents } from "~/components/web/table-of-contents"
import { Author } from "~/components/web/ui/author"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { blogConfig } from "~/config/blog"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateArticle } from "~/lib/structured-data"
import { findPost, findPostSlugs } from "~/server/web/posts/queries"

type Props = PageProps<"/blog/[slug]">

// Get page data
const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const post = await findPost({ where: { slug } })

  if (!post) {
    notFound()
  }

  const t = await getTranslations()
  const url = `/blog/${post.slug}`

  const data = getPageData(url, post.title, post.description ?? "", {
    breadcrumbs: [
      { url: "/blog", title: t("navigation.blog") },
      { url, title: post.title },
    ],
    structuredData: [generateArticle(url, post)],
  })

  return { post, ...data }
})

export const generateStaticParams = async () => {
  const posts = await findPostSlugs({})
  return posts.map(post => ({ slug: post.slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { post, url, metadata } = await getData(props)

  const openGraph: Metadata["openGraph"] = {
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    authors: post.author?.name,
  }

  const robots = post.status !== "Published" ? { index: false, follow: false } : undefined

  return getPageMetadata({ url, metadata: { ...metadata, openGraph, robots } })
}

export default async function (props: Props) {
  const { post, breadcrumbs, structuredData } = await getData(props)
  const t = await getTranslations()
  const format = await getFormatter()

  const headings = extractHeadingsFromMarkdown(post.content)
  const isUpdated = post.updatedAt > (post.publishedAt ?? post.createdAt)
  const readTime = getReadTime(post.plainText)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <PostPreviewAlert status={post.status} />

      <Intro>
        <IntroTitle>{post.title}</IntroTitle>
        {post.description && <IntroDescription>{post.description}</IntroDescription>}

        {post.author && (
          <Author
            prefix={t("posts.written_by")}
            note={
              <>
                <time dateTime={post.updatedAt.toISOString()}>
                  {isUpdated && `${t("posts.last_updated")}: `}
                  {format.dateTime(post.updatedAt, { dateStyle: "long" })}
                </time>

                {!!readTime && (
                  <>
                    <span className="px-1.5">&bull;</span>
                    <span>{t("posts.read_time", { count: readTime })}</span>
                  </>
                )}
              </>
            }
            className="mt-4"
            name={post.author.name}
            image={post.author.image ?? ""}
          />
        )}
      </Intro>

      {!!post.content && (
        <>
          <Section>
            <Section.Content>
              {post.imageUrl && (
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  width={1200}
                  height={630}
                  loading="eager"
                  className="w-full h-auto aspect-video object-cover rounded-lg"
                />
              )}

              <Markdown code={post.content} />
            </Section.Content>

            <Section.Sidebar className="max-h-(--sidebar-max-height)">
              <Suspense fallback={<AdCardSkeleton />}>
                <AdCard type="BlogPost" />
              </Suspense>

              {blogConfig.tableOfContents.enabled && !!headings.length && (
                <TableOfContents headings={headings} />
              )}
            </Section.Sidebar>
          </Section>

          <Nav title={post.title} className="self-start" />
        </>
      )}

      <StructuredData data={structuredData} />
    </>
  )
}
