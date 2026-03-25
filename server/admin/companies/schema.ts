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
  lifecycleStatus: string
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

export const companyLifecycleStatuses = ["Active", "Acquired", "Sunsetted"] as const

export const companyCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
})

/** One retail row in the admin company form (empty row is allowed; partial rows are rejected in superRefine). */
export const companyRetailLocationFormRowSchema = z.object({
  label: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  countryCode: z.string(),
  url: z.string(),
})

function retailRowHasAnyContent(r: z.infer<typeof companyRetailLocationFormRowSchema>) {
  return [
    r.label,
    r.city,
    r.addressLine1,
    r.addressLine2,
    r.region,
    r.postalCode,
    r.countryCode,
    r.url,
  ].some(v => v.trim() !== "")
}

export const companyUpdateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    status: z.enum(["draft", "published"]),
    lifecycleStatus: z.enum(companyLifecycleStatuses),
    tagline: optionalString,
    description: optionalString,
    logoUrl: optionalString,
    website: optionalString,
    foundedYear: z.coerce.number().int().optional().nullable(),
    totalFunding: z.string().optional().nullable(),
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
    funderIds: z.array(z.string()).optional(),
    certificationIds: z.array(z.string()).optional(),
    retailLocations: z.array(companyRetailLocationFormRowSchema).default([]),
  })
  .superRefine((data, ctx) => {
    data.retailLocations.forEach((r, i) => {
      if (!retailRowHasAnyContent(r)) return
      if (!r.label.trim() || !r.city.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Store label and city are required when adding a retail location.",
          path: ["retailLocations", i, "label"],
        })
      }
      const cc = r.countryCode.trim()
      if (cc && cc.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Country code must be 2 letters (e.g. US)",
          path: ["retailLocations", i, "countryCode"],
        })
      }
    })
  })

export type CompanyUpdateSchema = z.infer<typeof companyUpdateSchema>
