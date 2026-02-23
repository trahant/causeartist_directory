import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

export const tagsSearchParams = {
  q: parseAsString.withDefault(""),
  sort: parseAsStringEnum(["", "name.asc", "name.desc"]).withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(96),
  letter: parseAsString.withDefault(""),
}

export const tagsSearchParamsCache = createSearchParamsCache(tagsSearchParams)

export type TagsFilterSchema = typeof tagsSearchParams
export type TagsFilterParams = inferParserType<typeof tagsSearchParams>
