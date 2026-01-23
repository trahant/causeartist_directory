import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"
import { type Tool, ToolTier, ToolStatus } from "~/.generated/prisma/browser"
import { getSortingStateParser } from "~/lib/parsers"

export const toolTableParamsSchema = {
  name: parseAsString.withDefault(""),
  sort: getSortingStateParser<Tool>().withDefault([{ id: "createdAt", desc: true }]),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  operator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  status: parseAsArrayOf(parseAsStringEnum(Object.values(ToolStatus))).withDefault([]),
}

export const toolTableParamsCache = createSearchParamsCache(toolTableParamsSchema)
export type ToolTableSchema = Awaited<ReturnType<typeof toolTableParamsCache.parse>>

export const toolSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  websiteUrl: z.url().min(1, "Website is required"),
  affiliateUrl: z.url().optional().or(z.literal("")),
  tagline: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  faviconUrl: z.string().optional(),
  screenshotUrl: z.string().optional(),
  tier: z.enum(ToolTier).default("Free"),
  submitterName: z.string().optional(),
  submitterEmail: z.string().optional(),
  submitterNote: z.string().optional(),
  publishedAt: z.coerce.date().nullish(),
  status: z.enum(ToolStatus).default("Draft"),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notifySubmitter: z.boolean().default(true),
})

export type ToolSchema = z.infer<typeof toolSchema>
