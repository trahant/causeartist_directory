import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { type Post, PostStatus } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const postListParams = {
  title: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<Post>().withDefault([{ id: "createdAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  status: parseAsArrayOf(parseAsStringEnum(Object.values(PostStatus))).withDefault([]),
}

export const postListSchema = createStandardSchemaV1(postListParams)
export type PostListParams = inferParserType<typeof postListParams>

export const postSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  plainText: z.string().default(""),
  imageUrl: z.string().optional(),
  status: z.enum(PostStatus).default("Draft"),
  publishedAt: z.coerce.date().nullish(),
  authorId: z.string().min(1, "Author is required"),
})

export type PostSchema = z.infer<typeof postSchema>
