import type { Metadata } from "next"
import { cache, Suspense } from "react"
import { Card, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findPodcastEpisodes } from "~/server/web/podcast-episodes/queries"
import type { PodcastEpisodeMany } from "~/server/web/podcast-episodes/payloads"

const url = "/podcast/investing-in-impact"
const title = "Investing in Impact Podcast | Causeartist"
const description =
  "Conversations with impact investors, GPs, and impact VCs from around the world."

const getData = cache(async () => {
  const episodes = await findPodcastEpisodes({
    where: { show: "iip" },
    orderBy: { publishedAt: "desc" },
  })
  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/podcast", title: "Podcast" },
      { url, title: "Investing in Impact" },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })
  return { ...data, episodes }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

function EpisodeCard({ episode }: { episode: PodcastEpisodeMany }) {
  return (
    <Card hover asChild>
      <Link href={`/podcast/investing-in-impact/${episode.slug}`}>
        <CardHeader wrap={false}>
          <Stack className="gap-1.5" direction="row" wrap>
            <H4 as="h3" className="text-sm leading-snug!">
              {episode.title}
            </H4>
            {episode.episodeNumber != null && (
              <span className="text-sm text-muted-foreground">
                Episode {episode.episodeNumber}
              </span>
            )}
          </Stack>
        </CardHeader>
      </Link>
    </Card>
  )
}

export default async function InvestingInImpactPage() {
  const { episodes, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content>
          {episodes.length === 0 ? (
            <p className="text-muted-foreground">No episodes found.</p>
          ) : (
            <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-2">
              {episodes.map((episode: PodcastEpisodeMany) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
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
