import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { H2 } from "~/components/common/heading"
import { Prose } from "~/components/common/prose"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { Nav } from "~/components/web/nav"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Section } from "~/components/web/ui/section"
import { TableOfContents } from "~/components/web/table-of-contents"
import { addHeadingIdsToHtml } from "~/lib/content"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateGlossaryStructuredData } from "~/lib/schema"
import {
  findGlossaryTerm,
  findGlossaryTermSlugs,
} from "~/server/web/glossary/queries"
import type { Thing } from "schema-dts"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const term = await findGlossaryTerm({
    where: { slug },
  })

  if (!term) {
    notFound()
  }

  const url = `/glossary/${term.slug}`

  const data = getPageData(url, term.term, term.definition ?? "", {
    breadcrumbs: [
      { url: "/glossary", title: "Glossary" },
      { url, title: term.term },
    ],
    structuredData: generateGlossaryStructuredData(term) as Thing[],
  })

  return { term, ...data }
})

export const generateStaticParams = async () => {
  const terms = await findGlossaryTermSlugs({})
  return terms.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { term, url, metadata } = await getData(props)

  const title = term.seoTitle ?? metadata.title
  const description = term.seoDescription ?? term.definition ?? metadata.description

  const robots =
    term.status !== "published"
      ? { index: false as const, follow: false as const }
      : undefined

  return getPageMetadata({
    url,
    metadata: { ...metadata, title, description, robots },
  })
}

export default async function (props: Props) {
  const { term, metadata, breadcrumbs, structuredData } = await getData(props)
  const definition = term.definition ? addHeadingIdsToHtml(term.definition) : null
  const extendedContent = term.extendedContent ? addHeadingIdsToHtml(term.extendedContent) : null
  const tocContent = [definition, extendedContent].filter(Boolean).join("\n")

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Section>
        <Section.Content>
          <H2 as="h1" className="leading-tight!">
            {term.term}
          </H2>

          {definition && (
            <Prose
              className="prose prose-neutral dark:prose-invert max-w-none mt-4"
              dangerouslySetInnerHTML={{ __html: definition }}
            />
          )}

          {extendedContent && (
            <Prose
              className="prose prose-neutral dark:prose-invert max-w-none mt-6"
              dangerouslySetInnerHTML={{ __html: extendedContent }}
            />
          )}

          <Nav className="mt-6" title={metadata.title} />
        </Section.Content>

        <Section.Sidebar>
          <Suspense fallback={<AdCardSkeleton />}>
            <AdCard type="BlogPost" />
          </Suspense>
          {!!tocContent && <TableOfContents content={tocContent} />}
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
