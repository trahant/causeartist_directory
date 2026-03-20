import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

const directoryKindValues = ["all", "companies", "funders"]

/** URL `sort` param values; keep in sync with `searchDirectory` ordering. */
export const directorySortValues = ["name.asc", "name.desc", "newest"] as const

export const directoryFilterParams = {
  q: parseAsString.withDefault(""),
  kind: parseAsStringEnum(directoryKindValues).withDefault("all"),
  sector: parseAsString.withDefault(""),
  sort: parseAsStringEnum([...directorySortValues]).withDefault("name.asc"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(24),
}

export const directoryFilterParamsCache = createSearchParamsCache(directoryFilterParams)

export type DirectoryFilterSchema = typeof directoryFilterParams
export type DirectoryFilterParams = inferParserType<typeof directoryFilterParams>
