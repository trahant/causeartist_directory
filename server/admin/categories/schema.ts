import {
  createSearchParamsCache,
  createStandardSchemaV1,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import type { Category } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const categoryListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<Category>().withDefault([{ id: "name", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const categoryListSchema = createStandardSchemaV1(categoryListParams)
export const categoryListCache = createSearchParamsCache(categoryListParams)
export type CategoryListParams = Awaited<ReturnType<typeof categoryListCache.parse>>

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  tools: z.array(z.string()).optional(),
})

export type CategorySchema = z.infer<typeof categorySchema>
