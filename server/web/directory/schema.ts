import {
  createParser,
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

const parseAsDirectoryKind = createParser<"companies" | "funders">({
  parse: value => {
    if (value === "companies" || value === "funders") return value
    if (value === "all") return "companies"
    return null
  },
  serialize: String,
})

/** URL `sort` param values; keep in sync with directory search ordering. */
export const directorySortValues = ["name.asc", "name.desc", "newest"] as const

export const directoryFilterParams = {
  q: parseAsString.withDefault(""),
  kind: parseAsDirectoryKind.withDefault("companies"),
  sector: parseAsString.withDefault(""),
  location: parseAsString.withDefault(""),
  sort: parseAsStringEnum([...directorySortValues]).withDefault("name.asc"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(24),
}

export const directoryFilterParamsCache = createSearchParamsCache(directoryFilterParams)

export type DirectoryFilterSchema = typeof directoryFilterParams
export type DirectoryFilterParams = inferParserType<typeof directoryFilterParams>
