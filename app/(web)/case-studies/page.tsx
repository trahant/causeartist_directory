import type { Metadata } from "next"
import Image from "next/image"
import { cache, Suspense } from "react"
import { Card, CardHeader } from "~/components/common/card"
import { H2, H4 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findCaseStudies } from "~/server/web/case-studies/queries"
import type { CaseStudyMany } from "~/server/web/case-studies/payloads"

const url = "/case-studies"
const title = "Impact Case Studies | Causeartist"
const description = "Deep dives into how impact companies actually work."

const getData = cache(async () => {
  const caseStudies = await findCaseStudies({ orderBy: { publishedAt: "desc" } })
  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Case Studies" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
  return { ...data, caseStudies }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

function CaseStudyCard({ study }: { study: CaseStudyMany }) {
  return (
    <Card hover asChild>
      <Link href={`/case-studies/${study.slug}`}>
        {study.heroImageUrl && (
          <Image
            src={study.heroImageUrl}
            alt={study.title}
            width={1200}
            height={630}
            className="-m-5 mb-0 w-[calc(100%+2.5rem)] max-w-none aspect-video object-cover"
          />
        )}
        <CardHeader wrap={false}>
          <H4 as="h3" className="text-sm leading-snug!">
            {study.title}
          </H4>
        </CardHeader>
        {study.company && (
          <p className="text-sm text-muted-foreground">
            <Link href={`/companies/${study.company.slug}`}>{study.company.name}</Link>
          </p>
        )}
      </Link>
    </Card>
  )
}

export default async function CaseStudiesPage() {
  const { caseStudies, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-2">
            {caseStudies.map((study: CaseStudyMany) => (
              <CaseStudyCard key={study.id} study={study} />
            ))}
          </div>
          {caseStudies.length === 0 && (
            <p className="text-muted-foreground">No case studies found.</p>
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
