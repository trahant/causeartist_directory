import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type FunderListRow = {
  id: string
  name: string
  slug: string
  status: string
  type: string | null
  updatedAt: Date
  createdAt: Date
}

export const funderListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<FunderListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  status: parseAsString.withDefault(""),
}

export const funderListSchema = createStandardSchemaV1(funderListParams)
export type FunderListParams = inferParserType<typeof funderListParams>

const optionalString = z.string().optional().nullable()

export const funderUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  status: z.enum(["draft", "published"]),
  type: optionalString,
  description: optionalString,
  logoUrl: optionalString,
  website: optionalString,
  foundedYear: z.coerce.number().int().optional().nullable(),
  aum: optionalString,
  checkSizeMin: z.coerce.number().int().optional().nullable(),
  checkSizeMax: z.coerce.number().int().optional().nullable(),
  investmentThesis: optionalString,
  applicationUrl: optionalString,
  linkedin: optionalString,
  seoTitle: optionalString,
  seoDescription: optionalString,
  heroImageUrl: optionalString,
  keyBenefitsJson: z.string().optional().nullable(),
  sectorIds: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
  subcategoryIds: z.array(z.string()).optional(),
  stageIds: z.array(z.string()).optional(),
})

export type FunderUpdateSchema = z.infer<typeof funderUpdateSchema>
