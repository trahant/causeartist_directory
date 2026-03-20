import type { Metadata } from "next"
import { cache, Suspense } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findNewsletters } from "~/server/web/newsletters/queries"
import type { NewsletterMany } from "~/server/web/newsletters/payloads"

const url = "/newsletter"
const title = "Causeartist Weekly Newsletter"
const description =
  "Weekly roundup of impact funding, social entrepreneurship, and sustainable business news."

const getData = cache(async () => {
  const newsletters = await findNewsletters({
    where: {
      status: { in: ["draft", "published"] },
      OR: [
        { slug: { startsWith: "causeartist-weekly" } },
        { slug: { startsWith: "builder-brief" } },
        { slug: { startsWith: "monday-momentum" } },
      ],
    },
  })
  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Newsletter" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
  return { ...data, newsletters }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

const formatDate = (date: Date | null | undefined) => {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function NewsletterCard({ item }: { item: NewsletterMany }) {
  return (
    <Card asChild>
      <Link href={`/newsletter/${item.slug}`}>
        <CardHeader wrap={false}>
          <span className="font-semibold text-sm line-clamp-2">{item.title}</span>
        </CardHeader>
        <CardDescription>{item.excerpt}</CardDescription>
        <CardFooter>
          <span>{formatDate(item.publishedAt)}</span>
        </CardFooter>
      </Link>
    </Card>
  )
}

export default async function NewsletterPage() {
  const { newsletters, metadata, breadcrumbs, structuredData } = await getData()

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
            {newsletters.map((item: NewsletterMany) => (
              <NewsletterCard key={item.id} item={item} />
            ))}
          </div>
          {newsletters.length === 0 && (
            <p className="text-muted-foreground">No newsletter issues found.</p>
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
