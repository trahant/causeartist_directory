import {
  createSearchParamsCache,
  createStandardSchemaV1,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { type Tool, ToolStatus } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const toolListParams = {
  name: parseAsString.withDefault(""),
  sort: getSortingStateParser<Tool>().withDefault([{ id: "createdAt", desc: true }]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  status: parseAsArrayOf(parseAsStringEnum(Object.values(ToolStatus))).withDefault([]),
}

export const toolListSchema = createStandardSchemaV1(toolListParams)
export const toolListCache = createSearchParamsCache(toolListParams)
export type ToolListParams = Awaited<ReturnType<typeof toolListCache.parse>>
