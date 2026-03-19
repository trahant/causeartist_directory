import type { Metadata } from "next"
import { cache, Suspense } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
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

const url = "/podcast/disruptors-for-good"
const title = "Disruptors for Good Podcast | Causeartist"
const description =
  "Interviews with social entrepreneurs and impact business leaders from around the world."

const getData = cache(async () => {
  const episodes = await findPodcastEpisodes({
    where: { show: "dfg" },
    orderBy: { publishedAt: "desc" },
  })
  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/podcast", title: "Podcast" },
      { url, title: "Disruptors for Good" },
    ],
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

function EpisodeCard({ episode }: { episode: PodcastEpisodeMany }) {
  return (
    <Card asChild>
      <Link href={`/podcast/disruptors-for-good/${episode.slug}`}>
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

export default async function DisruptorsForGoodPage() {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
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
