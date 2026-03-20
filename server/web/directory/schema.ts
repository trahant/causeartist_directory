import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

const directoryKindValues = ["all", "companies", "funders"]

export const directoryFilterParams = {
  q: parseAsString.withDefault(""),
  kind: parseAsStringEnum(directoryKindValues).withDefault("all"),
  sector: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(24),
}

export const directoryFilterParamsCache = createSearchParamsCache(directoryFilterParams)

export type DirectoryFilterSchema = typeof directoryFilterParams
export type DirectoryFilterParams = inferParserType<typeof directoryFilterParams>
