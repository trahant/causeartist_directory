import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type BlogPostListRow = {
  id: string
  title: string
  slug: string
  status: string
  excerpt: string | null
  publishedAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export const blogPostListParams = {
  /** Search text (title or slug); URL key matches filter field id. */
  title: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<BlogPostListRow>().withDefault([{ id: "updatedAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const blogPostListSchema = createStandardSchemaV1(blogPostListParams)
export type BlogPostListParams = inferParserType<typeof blogPostListParams>

export const blogPostUpsertSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  status: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  authorId: z.string().optional().nullable(),
})

export type BlogPostUpsertSchema = z.infer<typeof blogPostUpsertSchema>
