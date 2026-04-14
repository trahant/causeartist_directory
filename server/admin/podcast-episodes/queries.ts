import { isTruthy } from "@primoui/utils"
import type { Prisma } from "~/.generated/prisma/client"
import type { PodcastEpisodeListParams } from "~/server/admin/podcast-episodes/schema"
import { db } from "~/services/db"

export const findPodcastEpisodes = async (
  search: PodcastEpisodeListParams,
  where?: Prisma.PodcastEpisodeWhereInput,
) => {
  const { title: searchText, page, perPage, sort } = search
  const offset = (page - 1) * perPage
  const orderBy = sort.map(item => ({ [item.id]: item.desc ? "desc" : "asc" }) as const)

  const expressions: (Prisma.PodcastEpisodeWhereInput | undefined)[] = [
    searchText
      ? {
          OR: [
            { title: { contains: searchText, mode: "insensitive" } },
            { slug: { contains: searchText, mode: "insensitive" } },
          ],
        }
      : undefined,
  ]

  const whereQuery: Prisma.PodcastEpisodeWhereInput = {
    AND: expressions.filter(isTruthy),
  }

  const [podcastEpisodes, podcastEpisodesTotal] = await db.$transaction([
    db.podcastEpisode.findMany({
      where: { ...whereQuery, ...where },
      orderBy: [...orderBy, { createdAt: "desc" }],
      take: perPage,
      skip: offset,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        show: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    db.podcastEpisode.count({ where: { ...whereQuery, ...where } }),
  ])

  return {
    podcastEpisodes,
    podcastEpisodesTotal,
    pageCount: Math.ceil(podcastEpisodesTotal / perPage),
  }
}

export const findPodcastEpisode = async (id: string) => {
  return db.podcastEpisode.findUnique({ where: { id } })
}

export const countPodcastEpisodes = async (where?: Prisma.PodcastEpisodeWhereInput) => {
  return db.podcastEpisode.count({ where })
}
