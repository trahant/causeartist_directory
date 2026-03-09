import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"
import type { Prisma } from "~/.generated/prisma/client"
import { adsConfig } from "~/config/ads"
import { createSortParser } from "~/lib/parsers"

export const toolSort = createSortParser<Prisma.ToolOrderByWithRelationInput>({
  "publishedAt.desc": { label: "sort_latest", orderBy: { publishedAt: "desc" } },
  "name.asc": { label: "sort_name_asc", orderBy: { name: "asc" } },
  "name.desc": { label: "sort_name_desc", orderBy: { name: "desc" } },
})

export const toolFilterParams = {
  q: parseAsString.withDefault(""),
  sort: toolSort.parser,
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(36 - (adsConfig.enabled ? adsConfig.adsPerPage : 0)),
  category: parseAsString.withDefault(""),
}

export const toolFilterParamsCache = createSearchParamsCache(toolFilterParams)

export type ToolFilterSchema = typeof toolFilterParams
export type ToolFilterParams = inferParserType<typeof toolFilterParams>
