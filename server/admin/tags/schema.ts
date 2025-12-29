import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import type { Tag } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const tagTableParamsSchema = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<Tag>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const tagTableParamsCache = createSearchParamsCache(tagTableParamsSchema)
export type TagTableSchema = Awaited<ReturnType<typeof tagTableParamsCache.parse>>

export const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  tools: z.array(z.string()).optional(),
})

export type TagSchema = z.infer<typeof tagSchema>
