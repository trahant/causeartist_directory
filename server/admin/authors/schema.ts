import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type AuthorListRow = {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export const authorListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<AuthorListRow>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const authorListSchema = createStandardSchemaV1(authorListParams)
export type AuthorListParams = inferParserType<typeof authorListParams>

export const authorUpsertSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
})

export type AuthorUpsertSchema = z.infer<typeof authorUpsertSchema>
