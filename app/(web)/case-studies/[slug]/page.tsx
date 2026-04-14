import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Link } from "~/components/common/link"
import { Prose } from "~/components/common/prose"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { Nav } from "~/components/web/nav"
import { StructuredData } from "~/components/web/structured-data"
import { TableOfContents } from "~/components/web/table-of-contents"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { ArticleAioBlocks } from "~/components/web/article/article-aio-blocks"
import { processContent, sanitizeGhostRichHtmlForDisplay } from "~/lib/content"
import {
  articleMetaDescription,
  articleMetaTitle,
  mergeArticleRobots,
  resolveArticleCanonicalForMetadata,
  resolveArticleOgImageUrl,
} from "~/lib/article-public-meta"
import { readFaqItemsFromDb } from "~/lib/article-seo-json"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateArticleFaqPageSchema, generateArticleSchema } from "~/lib/schema"
import { findCaseStudy, findCaseStudySlugs } from "~/server/web/case-studies/queries"
import type { Thing } from "schema-dts"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const caseStudy = await findCaseStudy({
    where: { slug, status: "published" },
  })

  if (!caseStudy) {
    notFound()
  }

  const url = `/case-studies/${caseStudy.slug}`

  const metaTitle = articleMetaTitle(caseStudy.seoTitle, caseStudy.title)
  const metaDescription = articleMetaDescription(caseStudy.seoDescription, caseStudy.excerpt, "")

  const faqForSchema = readFaqItemsFromDb(caseStudy.faqItems)
  const structuredData = [
    generateArticleSchema({
      ...caseStudy,
      path: url,
    }),
    ...(faqForSchema.length > 0 ? [generateArticleFaqPageSchema(faqForSchema, url)] : []),
  ] as Thing[]

  const data = getPageData(url, metaTitle, metaDescription, {
    breadcrumbs: [
      { url: "/case-studies", title: "Case Studies" },
      { url, title: caseStudy.title },
    ],
    structuredData,
  })

  return { caseStudy, ...data }
})

export const generateStaticParams = async () => {
  const caseStudies = await findCaseStudySlugs({})
  return caseStudies.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { caseStudy, url, metadata } = await getData(props)

  const title = articleMetaTitle(caseStudy.seoTitle, caseStudy.title)
  const description = articleMetaDescription(
    caseStudy.seoDescription,
    caseStudy.excerpt,
    String(metadata.description ?? ""),
  )

  const openGraph: Metadata["openGraph"] = {
    type: "article",
    publishedTime: caseStudy.publishedAt?.toISOString(),
    modifiedTime: (caseStudy.updatedAt ?? caseStudy.publishedAt)?.toISOString(),
  }

  const robots = mergeArticleRobots({
    isUnpublished: caseStudy.status !== "published",
    metaRobots: caseStudy.metaRobots,
  })

  const absoluteOgImageUrl = resolveArticleOgImageUrl(caseStudy.ogImageUrl, caseStudy.heroImageUrl)
  const canonicalUrl = resolveArticleCanonicalForMetadata(url, caseStudy.canonicalUrl)

  return getPageMetadata({
    url,
    canonicalUrl,
    absoluteOgImageUrl,
    metadata: { ...metadata, title, description, openGraph, robots },
  })
}

export default async function (props: Props) {
  const { caseStudy, breadcrumbs, structuredData } = await getData(props)
  const content = processContent(sanitizeGhostRichHtmlForDisplay(caseStudy.content ?? ""))

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{caseStudy.title}</IntroTitle>
        {caseStudy.excerpt && (
          <IntroDescription>{caseStudy.excerpt}</IntroDescription>
        )}
        {caseStudy.company && (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href={`/companies/${caseStudy.company.slug}`}>
              {caseStudy.company.name}
            </Link>
          </p>
        )}
      </Intro>

      {!!caseStudy.content && (
        <>
          <Section>
            <Section.Content>
              {(caseStudy.heroImageUrl || caseStudy.ogImageUrl) && (
                <Image
                  src={(caseStudy.heroImageUrl || caseStudy.ogImageUrl) as string}
                  alt={caseStudy.ogImageAlt?.trim() || caseStudy.title}
                  width={1200}
                  height={630}
                  loading="eager"
                  className="w-full h-auto aspect-video object-cover rounded-lg"
                />
              )}

              <ArticleAioBlocks
                keyTakeaways={caseStudy.keyTakeaways}
                sources={caseStudy.sources}
                faqItems={caseStudy.faqItems}
              />

              <Prose className="max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            </Section.Content>

            <Section.Sidebar className="max-h-(--sidebar-max-height)">
              <Suspense fallback={<AdCardSkeleton />}>
                <AdCard type="BlogPost" />
              </Suspense>

              <TableOfContents content={content} />
            </Section.Sidebar>
          </Section>

          <Nav title={caseStudy.title} className="self-start" />
        </>
      )}

      <StructuredData data={structuredData} />
    </>
  )
}
