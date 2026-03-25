import type { Metadata } from "next"
import { cache } from "react"
import { PodcastEpisodeListCard } from "~/components/web/podcasts/episode-list-card"
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

export default async function DisruptorsForGoodPage() {
  const { episodes, metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {episodes.length === 0 ? (
            <p className="text-muted-foreground">No episodes found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {episodes.map((episode: PodcastEpisodeMany) => (
                <PodcastEpisodeListCard
                  key={episode.id}
                  episode={episode}
                  href={`/podcast/disruptors-for-good/${episode.slug}`}
                />
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
