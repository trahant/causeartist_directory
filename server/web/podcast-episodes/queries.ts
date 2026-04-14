import { cacheLife, cacheTag } from "next/cache"
import type { Prisma } from "~/.generated/prisma/client"
import {
  podcastEpisodeManyPayload,
  podcastEpisodeOnePayload,
} from "~/server/web/podcast-episodes/payloads"
import { db } from "~/services/db"

export const findPodcastEpisodes = async ({
  where,
  orderBy,
  ...args
}: Prisma.PodcastEpisodeFindManyArgs) => {
  "use cache"

  cacheTag("podcast-episodes")
  cacheLife("infinite")

  return db.podcastEpisode.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: podcastEpisodeManyPayload,
  })
}

export const findPodcastEpisodeSlugs = async ({
  where,
  orderBy,
  ...args
}: Prisma.PodcastEpisodeFindManyArgs) => {
  "use cache"

  cacheTag("podcast-episodes")
  cacheLife("infinite")

  return db.podcastEpisode.findMany({
    ...args,
    where: { status: "published", ...where },
    orderBy: orderBy ?? { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  })
}

export const findPodcastEpisode = async ({
  where,
  ...args
}: Prisma.PodcastEpisodeFindFirstArgs = {}) => {
  "use cache"

  cacheTag("podcast-episode", `podcast-episode-${where?.slug}`)
  cacheLife("infinite")

  return db.podcastEpisode.findFirst({
    ...args,
    where: { status: "published", ...where },
    select: podcastEpisodeOnePayload,
  })
}
