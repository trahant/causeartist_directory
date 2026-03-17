import type { Metadata } from "next"
import Image from "next/image"
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

function NewsletterCard({ item }: { item: NewsletterMany }) {
  return (
    <Card hover asChild>
      <Link href={`/newsletter/${item.slug}`}>
        {item.heroImageUrl && (
          <Image
            src={item.heroImageUrl}
            alt={item.title}
            width={1200}
            height={630}
            className="-m-5 mb-0 w-[calc(100%+2.5rem)] max-w-none aspect-video object-cover"
          />
        )}
        <CardHeader wrap={false}>
          <H4 as="h3" className="text-sm leading-snug!">
            {item.title}
          </H4>
        </CardHeader>
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
          <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-2">
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
          <Suspense>
            <FeaturedToolsIcons />
          </Suspense>
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
