import type { Metadata } from "next"
import { cache, Suspense } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
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
import { findPodcastEpisodes } from "~/server/web/podcast-episodes/queries"
import type { PodcastEpisodeMany } from "~/server/web/podcast-episodes/payloads"

const url = "/podcast"
const title = "Impact Podcasts | Causeartist"
const description =
  "Two podcast shows exploring social entrepreneurship and impact investing."

const getData = cache(async () => {
  const episodes = await findPodcastEpisodes({})
  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Podcast" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
  return { ...data, episodes }
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

function episodeHref(episode: PodcastEpisodeMany): string {
  if (episode.show === "dfg") return `/podcast/disruptors-for-good/${episode.slug}`
  if (episode.show === "iip") return `/podcast/investing-in-impact/${episode.slug}`
  return `/podcast/${episode.slug}`
}

function EpisodeCard({ episode }: { episode: PodcastEpisodeMany }) {
  return (
    <Card asChild>
      <Link href={episodeHref(episode)}>
        <CardHeader wrap={false}>
          <span className="font-semibold text-sm line-clamp-2">{episode.title}</span>
        </CardHeader>
        <CardDescription>{episode.excerpt}</CardDescription>
        <CardFooter>
          <span>{formatDate(episode.publishedAt)}</span>
        </CardFooter>
      </Link>
    </Card>
  )
}

export default async function PodcastPage() {
  const { episodes, metadata, breadcrumbs, structuredData } = await getData()

  const dfg = episodes.filter((e: PodcastEpisodeMany) => e.show === "dfg")
  const iip = episodes.filter((e: PodcastEpisodeMany) => e.show === "iip")
  const other = episodes.filter(
    (e: PodcastEpisodeMany) => e.show !== "dfg" && e.show !== "iip",
  )

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          {dfg.length > 0 && (
            <Stack direction="column" className="w-full gap-4">
              <H2 as="h2" className="text-xl">
                Disruptors for Good
              </H2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {dfg.map((episode: PodcastEpisodeMany) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </div>
            </Stack>
          )}

          {iip.length > 0 && (
            <Stack direction="column" className="w-full gap-4">
              <H2 as="h2" className="text-xl">
                Investing in Impact
              </H2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {iip.map((episode: PodcastEpisodeMany) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </div>
            </Stack>
          )}

          {other.length > 0 && (
            <Stack direction="column" className="w-full gap-4">
              <H2 as="h2" className="text-xl">
                Other Episodes
              </H2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {other.map((episode: PodcastEpisodeMany) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </div>
            </Stack>
          )}

          {episodes.length === 0 && (
            <p className="text-muted-foreground">No episodes found.</p>
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
