import {
  createSearchParamsCache,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { directorySortValues } from "~/server/web/directory/schema"

export const companyListFilterParams = {
  q: parseAsString.withDefault(""),
  sector: parseAsString.withDefault(""),
  location: parseAsString.withDefault(""),
  sort: parseAsStringEnum([...directorySortValues]).withDefault("name.asc"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(24),
}

export const companyListFilterParamsCache = createSearchParamsCache(companyListFilterParams)

export type CompanyListFilterSchema = typeof companyListFilterParams
export type CompanyListFilterParams = inferParserType<typeof companyListFilterParams>
