import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"
import { articleSeoFormFieldsSchema } from "~/server/admin/shared/article-seo-schema"

export type CaseStudyListRow = {
  id: string
  title: string
  slug: string
  status: string
  excerpt: string | null
  publishedAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export const caseStudyListParams = {
  title: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<CaseStudyListRow>().withDefault([{ id: "updatedAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const caseStudyListSchema = createStandardSchemaV1(caseStudyListParams)
export type CaseStudyListParams = inferParserType<typeof caseStudyListParams>

export const caseStudyUpsertSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    slug: z.string().optional(),
    status: z.string().min(1),
    excerpt: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    heroImageUrl: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    publishedAt: z.coerce.date().optional().nullable(),
    companyId: z.string().optional().nullable(),
  })
  .merge(articleSeoFormFieldsSchema)

export type CaseStudyUpsertSchema = z.infer<typeof caseStudyUpsertSchema>
