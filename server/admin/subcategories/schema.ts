import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type SubcategoryListRow = {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export const subcategoryListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<SubcategoryListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const subcategoryListSchema = createStandardSchemaV1(subcategoryListParams)
export type SubcategoryListParams = inferParserType<typeof subcategoryListParams>

export const subcategoryUpsertSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
})

export type SubcategoryUpsertSchema = z.infer<typeof subcategoryUpsertSchema>
