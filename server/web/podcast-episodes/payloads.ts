import type { Prisma } from "~/.generated/prisma/client"

export const podcastEpisodeOnePayload = {
  id: true,
  title: true,
  slug: true,
  status: true,
  show: true,
  episodeNumber: true,
  description: true,
  content: true,
  heroImageUrl: true,
  spotifyUrl: true,
  appleUrl: true,
  youtubeUrl: true,
  excerpt: true,
  guestName: true,
  guestTitle: true,
  guestCompany: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PodcastEpisodeSelect

export const podcastEpisodeManyPayload = {
  id: true,
  title: true,
  slug: true,
  status: true,
  show: true,
  episodeNumber: true,
  description: true,
  heroImageUrl: true,
  excerpt: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.PodcastEpisodeSelect

export type PodcastEpisodeOne = Prisma.PodcastEpisodeGetPayload<{
  select: typeof podcastEpisodeOnePayload
}>
export type PodcastEpisodeMany = Prisma.PodcastEpisodeGetPayload<{
  select: typeof podcastEpisodeManyPayload
}>
