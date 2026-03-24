import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type LocationListRow = {
  id: string
  name: string
  slug: string
  country: string | null
  region: string | null
  countryCode: string | null
  createdAt: Date
}

export const locationListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<LocationListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const locationListSchema = createStandardSchemaV1(locationListParams)
export type LocationListParams = inferParserType<typeof locationListParams>

export const locationUpsertSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  countryCode: z.string().optional().nullable(),
})

export type LocationUpsertSchema = z.infer<typeof locationUpsertSchema>
