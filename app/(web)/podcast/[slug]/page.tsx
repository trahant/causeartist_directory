import { ArrowUpRightIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Button } from "~/components/common/button"
import { H2 } from "~/components/common/heading"
import { Prose } from "~/components/common/prose"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { ExternalLink } from "~/components/web/external-link"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { Nav } from "~/components/web/nav"
import { StructuredData } from "~/components/web/structured-data"
import { TableOfContents } from "~/components/web/table-of-contents"
import { Backdrop } from "~/components/web/ui/backdrop"
import { IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { Sticky } from "~/components/web/ui/sticky"
import type { Thing } from "schema-dts"
import { addHeadingIdsToHtml } from "~/lib/content"
import type { OpenGraphParams } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generatePodcastSchema } from "~/lib/schema"
import {
  findPodcastEpisode,
  findPodcastEpisodeSlugs,
} from "~/server/web/podcast-episodes/queries"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const episode = await findPodcastEpisode({ where: { slug } })

  if (!episode) {
    notFound()
  }

  const url = `/podcast/${episode.slug}`
  const title = episode.title
  const description = episode.excerpt ?? episode.description ?? ""

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/podcast", title: "Podcast" },
      { url, title: episode.title },
    ],
    structuredData: [generatePodcastSchema(episode)] as Thing[],
  })

  return { episode, ...data }
})

export const generateStaticParams = async () => {
  const episodes = await findPodcastEpisodeSlugs({})
  return episodes.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { episode, url, metadata } = await getData(props)

  const title = episode.seoTitle ?? metadata.title
  const description =
    episode.seoDescription ?? episode.excerpt ?? episode.description ?? metadata.description

  const ogImage: OpenGraphParams = {
    title: episode.title,
    description: String(description),
  }

  const robots =
    episode.status !== "published"
      ? { index: false as const, follow: false as const }
      : undefined

  return getPageMetadata({
    url,
    metadata: { ...metadata, title, description, robots },
    ogImage,
  })
}

export default async function (props: Props) {
  const { episode, metadata, structuredData } = await getData(props)
  const content = episode.content ? addHeadingIdsToHtml(episode.content) : null

  return (
    <>
      <Section>
        <Section.Content className="max-md:contents">
          <Sticky isOverlay>
            <Stack className="@container self-stretch">
              <Stack className="flex-1 min-w-0">
                <H2 as="h1" className="leading-tight!">
                  {episode.title}
                </H2>
                {episode.episodeNumber != null && (
                  <span className="text-sm text-muted-foreground">
                    Episode {episode.episodeNumber}
                  </span>
                )}
              </Stack>

              <Backdrop />
            </Stack>
          </Sticky>

          {(episode.excerpt ?? episode.description) && (
            <IntroDescription className="-mt-fluid-md pt-4">
              {episode.excerpt ?? episode.description}
            </IntroDescription>
          )}

          {episode.heroImageUrl && (
            <Image
              src={episode.heroImageUrl}
              alt={episode.title}
              width={1200}
              height={630}
              loading="eager"
              className="w-full h-auto aspect-video object-cover rounded-lg mt-6"
            />
          )}

          <Stack className="w-full -mt-fluid-md pt-8 gap-2" direction="row" wrap>
            {episode.spotifyUrl && (
              <Button variant="primary" suffix={<ArrowUpRightIcon />} asChild>
                <ExternalLink href={episode.spotifyUrl} doFollow doTrack>
                  Listen on Spotify
                </ExternalLink>
              </Button>
            )}
            {episode.appleUrl && (
              <Button variant="secondary" suffix={<ArrowUpRightIcon />} asChild>
                <ExternalLink href={episode.appleUrl} doFollow doTrack>
                  Apple Podcasts
                </ExternalLink>
              </Button>
            )}
            {episode.youtubeUrl && (
              <Button variant="secondary" suffix={<ArrowUpRightIcon />} asChild>
                <ExternalLink href={episode.youtubeUrl} doFollow doTrack>
                  YouTube
                </ExternalLink>
              </Button>
            )}
          </Stack>

          {content && (
            <Prose
              className="prose prose-neutral dark:prose-invert max-w-none max-md:order-4"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          <Stack className="w-full md:sticky md:bottom-2 md:z-10 max-md:order-9">
            <div className="absolute -inset-x-1 -bottom-3 -top-8 -z-1 pointer-events-none bg-background mask-t-from-66% max-md:hidden" />
            <Nav className="mr-auto" title={metadata.title} />
          </Stack>
        </Section.Content>

        <Section.Sidebar className="max-md:contents">
          <Suspense fallback={<AdCardSkeleton className="max-md:order-3" />}>
            <AdCard type="ToolPage" className="max-md:order-3" />
          </Suspense>
          {content && <TableOfContents content={content} className="max-md:order-7" />}
          <Suspense>
            <FeaturedToolsIcons className="max-md:order-8" />
          </Suspense>
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
