import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type SectorListRow = {
  id: string
  name: string
  slug: string
  heroText: string | null
  createdAt: Date
}

export const sectorListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<SectorListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const sectorListSchema = createStandardSchemaV1(sectorListParams)
export type SectorListParams = inferParserType<typeof sectorListParams>

export const sectorUpsertSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  heroText: z.string().optional().nullable(),
})

export type SectorUpsertSchema = z.infer<typeof sectorUpsertSchema>
