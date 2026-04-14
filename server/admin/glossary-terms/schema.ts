import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type GlossaryTermListRow = {
  id: string
  term: string
  slug: string
  status: string
  updatedAt: Date
  createdAt: Date
}

export const glossaryTermListParams = {
  term: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<GlossaryTermListRow>().withDefault([{ id: "term", desc: false }]),
}

export const glossaryTermListSchema = createStandardSchemaV1(glossaryTermListParams)
export type GlossaryTermListParams = inferParserType<typeof glossaryTermListParams>

export const glossaryTermCreateSchema = z.object({
  term: z.string().min(1, "Term is required"),
  slug: z.string().optional(),
  status: z.string().min(1),
  definition: z.string().optional().nullable(),
  extendedContent: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
})

export type GlossaryTermCreateSchema = z.infer<typeof glossaryTermCreateSchema>

export const glossaryTermUpdateSchema = glossaryTermCreateSchema.partial().extend({
  id: z.string(),
})

export type GlossaryTermUpdateSchema = z.infer<typeof glossaryTermUpdateSchema>

export const glossaryTermFormSchema = glossaryTermCreateSchema.extend({
  id: z.string().optional(),
})

export type GlossaryTermFormValues = z.infer<typeof glossaryTermFormSchema>
