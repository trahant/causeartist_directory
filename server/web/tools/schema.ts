import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { adsConfig } from "~/config/ads"

export const toolFilterParams = {
  q: parseAsString.withDefault(""),
  sort: parseAsStringEnum(["", "publishedAt.desc", "name.asc", "name.desc"]).withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(36 - (adsConfig.enabled ? adsConfig.adsPerPage : 0)),
  category: parseAsString.withDefault(""),
}

export const toolFilterParamsCache = createSearchParamsCache(toolFilterParams)

export type ToolFilterSchema = typeof toolFilterParams
export type ToolFilterParams = inferParserType<typeof toolFilterParams>
