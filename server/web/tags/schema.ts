import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"
import type { Prisma } from "~/.generated/prisma/client"
import { createSortParser } from "~/lib/parsers"

export const tagSort = createSortParser<Prisma.TagOrderByWithRelationInput>({
  "name.asc": { label: "sort_name_asc", orderBy: { name: "asc" } },
  "name.desc": { label: "sort_name_desc", orderBy: { name: "desc" } },
})

export const tagsSearchParams = {
  q: parseAsString.withDefault(""),
  sort: tagSort.parser,
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(96),
  letter: parseAsString.withDefault(""),
}

export const tagsSearchParamsCache = createSearchParamsCache(tagsSearchParams)

export type TagsFilterSchema = typeof tagsSearchParams
export type TagsFilterParams = inferParserType<typeof tagsSearchParams>
