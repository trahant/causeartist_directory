import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type PodcastEpisodeListRow = {
  id: string
  title: string
  slug: string
  status: string
  show: string | null
  publishedAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export const podcastShowFormSchema = z.enum(["dfg", "iip", "generic"])

export const podcastEpisodeListParams = {
  title: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<PodcastEpisodeListRow>().withDefault([{ id: "publishedAt", desc: true }]),
}

/** URL/query schema for admin episode list (same role as `blogPostListSchema`). */
export const podcastEpisodeListSchema = createStandardSchemaV1(podcastEpisodeListParams)
/** Alias for list route input schema. */
export const podcastEpisodeSchema = podcastEpisodeListSchema
export type PodcastEpisodeListParams = inferParserType<typeof podcastEpisodeListParams>

const optionalUrl = z.string().optional().nullable()

export const podcastEpisodeCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  status: z.string().min(1),
    show: podcastShowFormSchema,
  episodeNumber: z.number().int().nullable().optional(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  heroImageUrl: optionalUrl,
  spotifyUrl: optionalUrl,
  appleUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  guestName: z.string().optional().nullable(),
  guestTitle: z.string().optional().nullable(),
  guestCompany: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  publishedAt: z.date().optional().nullable(),
})

export type PodcastEpisodeCreateSchema = z.infer<typeof podcastEpisodeCreateSchema>

export const podcastEpisodeUpdateSchema = podcastEpisodeCreateSchema.partial().extend({
  id: z.string(),
})

export type PodcastEpisodeUpdateSchema = z.infer<typeof podcastEpisodeUpdateSchema>

/** Admin form: optional `id` means create; present means update. */
export const podcastEpisodeFormSchema = podcastEpisodeCreateSchema.extend({
  id: z.string().optional(),
})

export type PodcastEpisodeFormValues = z.infer<typeof podcastEpisodeFormSchema>
