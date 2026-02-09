import * as z from "zod"
import { ToolStatus, ToolTier } from "~/.generated/prisma/browser"

export { toolListParams, toolListSchema, type ToolListParams } from "~/server/shared/tools/schema"

export const toolSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  websiteUrl: z.url({ protocol: /^https?$/, normalize: true }).min(1, "Website is required"),
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
