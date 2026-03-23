import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

/** Shape returned by `findAdminCompanies` list query (sortable columns). */
export type CompanyListRow = {
  id: string
  name: string
  slug: string
  status: string
  tagline: string | null
  updatedAt: Date
  createdAt: Date
}

export const companyListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<CompanyListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  status: parseAsString.withDefault(""),
}

export const companyListSchema = createStandardSchemaV1(companyListParams)
export type CompanyListParams = inferParserType<typeof companyListParams>

/** Allow empty string or any string (URLs validated loosely in admin). */
const optionalString = z.string().optional().nullable()

export const companyUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  status: z.enum(["draft", "published"]),
  tagline: optionalString,
  description: optionalString,
  logoUrl: optionalString,
  website: optionalString,
  foundedYear: z.coerce.number().int().optional().nullable(),
  totalFunding: z.string().optional().nullable(),
  linkedin: optionalString,
  twitter: optionalString,
  founderName: z.string().optional().nullable(),
  impactModel: z.string().optional().nullable(),
  impactMetrics: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  heroImageUrl: optionalString,
  /** JSON string for `keyBenefits` array; empty string clears */
  keyBenefitsJson: z.string().optional().nullable(),
  sectorIds: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
  subcategoryIds: z.array(z.string()).optional(),
  certificationIds: z.array(z.string()).optional(),
})

export type CompanyUpdateSchema = z.infer<typeof companyUpdateSchema>
