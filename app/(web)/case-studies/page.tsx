import type { Metadata } from "next"
import { cache, Suspense } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
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

const formatDate = (date: Date | null | undefined) => {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

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
    <Card asChild>
      <Link href={`/case-studies/${study.slug}`}>
        <CardHeader wrap={false}>
          <span className="font-semibold text-sm line-clamp-2">{study.title}</span>
        </CardHeader>
        <CardDescription>{study.excerpt}</CardDescription>
        <CardFooter>
          <span>{formatDate(study.publishedAt)}</span>
          {study.company ? <span>{study.company.name}</span> : null}
        </CardFooter>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
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
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
