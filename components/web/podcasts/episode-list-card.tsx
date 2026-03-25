import Image from "next/image"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import type { PodcastEpisodeMany } from "~/server/web/podcast-episodes/payloads"

const formatDate = (date: Date | null | undefined) => {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type PodcastEpisodeListCardProps = {
  episode: PodcastEpisodeMany
  href: string
}

export const PodcastEpisodeListCard = ({ episode, href }: PodcastEpisodeListCardProps) => {
  return (
    <Card asChild className="p-0 overflow-hidden">
      <Link href={href} className="flex flex-col w-full min-w-0 text-start">
        {episode.heroImageUrl ? (
          <div className="relative w-full aspect-video bg-muted shrink-0">
            <Image
              src={episode.heroImageUrl}
              alt={episode.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-muted shrink-0" aria-hidden />
        )}
        <Stack className="w-full gap-4 p-5">
          <CardHeader wrap={false}>
            <span className="font-semibold text-sm line-clamp-2">{episode.title}</span>
          </CardHeader>
          <CardDescription>{episode.excerpt}</CardDescription>
          <CardFooter>
            <span>{formatDate(episode.publishedAt)}</span>
          </CardFooter>
        </Stack>
      </Link>
    </Card>
  )
}
