import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { type Ad, AdType } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const adListParams = {
  name: parseAsString.withDefault(""),
  type: parseAsArrayOf(parseAsStringEnum(Object.values(AdType))).withDefault([]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: getSortingStateParser<Ad>().withDefault([{ id: "createdAt", desc: true }]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
}

export const adListSchema = createStandardSchemaV1(adListParams)
export type AdListParams = inferParserType<typeof adListParams>

export const adSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    email: z.email("Valid email is required"),
    description: z.string().optional(),
    websiteUrl: z.url({ protocol: /^https?$/, normalize: true }).min(1, "Website URL is required"),
    faviconUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    buttonLabel: z.string().optional(),
    type: z.enum(AdType).default("All"),
    startsAt: z.date(),
    endsAt: z.date(),
  })
  .refine(data => data.endsAt > data.startsAt, {
    error: "End date must be after start date",
    path: ["endsAt"],
  })

export type AdSchema = z.infer<typeof adSchema>
