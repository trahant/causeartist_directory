import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { directorySortValues } from "~/server/web/directory/schema"

export const funderListFilterParams = {
  q: parseAsString.withDefault(""),
  sector: parseAsString.withDefault(""),
  location: parseAsString.withDefault(""),
  funderType: parseAsString.withDefault(""),
  sort: parseAsStringEnum([...directorySortValues]).withDefault("name.asc"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(24),
}

export const funderListFilterParamsCache = createSearchParamsCache(funderListFilterParams)

export type FunderListFilterSchema = typeof funderListFilterParams
export type FunderListFilterParams = inferParserType<typeof funderListFilterParams>
