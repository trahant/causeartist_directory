import * as z from "zod"

export const articleContentTypes = [
  "guide",
  "listicle",
  "comparison",
  "news",
  "opinion",
  "other",
] as const

export type ArticleContentType = (typeof articleContentTypes)[number]

export const secondaryKeywordsSchema = z.array(z.string().max(120)).max(40)

const sourceItemSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().max(2000),
  publisher: z.string().max(200).optional().nullable(),
  publishedAt: z.string().max(40).optional().nullable(),
})

export const sourcesSchema = z.array(sourceItemSchema).max(50)

const faqItemSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(20000),
})

export const faqItemsSchema = z.array(faqItemSchema).max(80)

export const keyTakeawaysSchema = z.array(z.string().min(1).max(500)).max(20)

function parseJsonField<T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>,
  label: string,
): T | null {
  if (raw == null || !String(raw).trim()) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw)) as unknown
  } catch {
    throw new Error(`Invalid JSON for ${label}`)
  }
  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`${label}: ${result.error.issues.map(i => i.message).join("; ")}`)
  }
  return result.data
}

export function parseSecondaryKeywordsJson(raw: string | null | undefined): string[] | null {
  const v = parseJsonField(raw, secondaryKeywordsSchema, "Secondary keywords")
  return v && v.length > 0 ? v : null
}

export function parseSourcesJson(raw: string | null | undefined): z.infer<typeof sourcesSchema> | null {
  const v = parseJsonField(raw, sourcesSchema, "Sources")
  return v && v.length > 0 ? v : null
}

export function parseFaqItemsJson(raw: string | null | undefined): z.infer<typeof faqItemsSchema> | null {
  const v = parseJsonField(raw, faqItemsSchema, "FAQ items")
  return v && v.length > 0 ? v : null
}

export function parseKeyTakeawaysJson(raw: string | null | undefined): string[] | null {
  const v = parseJsonField(raw, keyTakeawaysSchema, "Key takeaways")
  return v && v.length > 0 ? v : null
}

export function stringifyArticleJsonField(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  return JSON.stringify(value, null, 2)
}

export function readSecondaryKeywordsFromDb(raw: unknown): string[] {
  const r = secondaryKeywordsSchema.safeParse(raw)
  return r.success ? r.data : []
}

export function readSourcesFromDb(raw: unknown): z.infer<typeof sourcesSchema> {
  const r = sourcesSchema.safeParse(raw)
  return r.success ? r.data : []
}

export function readFaqItemsFromDb(raw: unknown): z.infer<typeof faqItemsSchema> {
  const r = faqItemsSchema.safeParse(raw)
  return r.success ? r.data : []
}

export function readKeyTakeawaysFromDb(raw: unknown): string[] {
  const r = keyTakeawaysSchema.safeParse(raw)
  return r.success ? r.data : []
}

/** Plain-text-ish word count for reading time (markdown or HTML). */
export function estimateReadingTimeMinutes(text: string | null | undefined): number | null {
  if (!text?.trim()) return null
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words < 1) return null
  return Math.max(1, Math.round(words / 200))
}
