import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type CertificationListRow = {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  website: string | null
  createdAt: Date
}

export const certificationListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<CertificationListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const certificationListSchema = createStandardSchemaV1(certificationListParams)
export type CertificationListParams = inferParserType<typeof certificationListParams>

export const certificationUpsertSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
})

export type CertificationUpsertSchema = z.infer<typeof certificationUpsertSchema>
