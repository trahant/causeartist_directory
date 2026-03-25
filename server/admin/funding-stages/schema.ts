import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { getSortingStateParser } from "~/lib/parsers"

export type FundingStageListRow = {
  id: string
  name: string
  slug: string
  sortOrder: number
}

export const fundingStageListParams = {
  name: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<FundingStageListRow>().withDefault([{ id: "sortOrder", desc: false }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const fundingStageListSchema = createStandardSchemaV1(fundingStageListParams)
export type FundingStageListParams = inferParserType<typeof fundingStageListParams>

export const fundingStageUpsertSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  sortOrder: z.number().int().min(0).default(100),
})

export type FundingStageUpsertSchema = z.infer<typeof fundingStageUpsertSchema>
