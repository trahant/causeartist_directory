import type { Metadata } from "next"
import { cache } from "react"
import { PodcastEpisodeListCard } from "~/components/web/podcasts/episode-list-card"
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

function episodeHref(episode: PodcastEpisodeMany): string {
  if (episode.show === "dfg") return `/podcast/disruptors-for-good/${episode.slug}`
  if (episode.show === "iip") return `/podcast/investing-in-impact/${episode.slug}`
  return `/podcast/${episode.slug}`
}

export default async function PodcastPage() {
  const { episodes, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {episodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {episodes.map((episode: PodcastEpisodeMany) => (
                <PodcastEpisodeListCard
                  key={episode.id}
                  episode={episode}
                  href={episodeHref(episode)}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No episodes found.</p>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
