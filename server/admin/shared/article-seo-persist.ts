import type { Prisma } from "~/.generated/prisma/client"
import {
  estimateReadingTimeMinutes,
  parseFaqItemsJson,
  parseKeyTakeawaysJson,
  parseSecondaryKeywordsJson,
  parseSourcesJson,
} from "~/lib/article-seo-json"

export type ArticleSeoJsonInput = {
  secondaryKeywordsJson?: string | null
  sourcesJson?: string | null
  faqItemsJson?: string | null
  keyTakeawaysJson?: string | null
}

export function parseArticleSeoJsonForPersist(input: ArticleSeoJsonInput): {
  secondaryKeywords: Prisma.InputJsonValue | null
  sources: Prisma.InputJsonValue | null
  faqItems: Prisma.InputJsonValue | null
  keyTakeaways: Prisma.InputJsonValue | null
} {
  let secondaryKeywords: string[] | null
  let sources: ReturnType<typeof parseSourcesJson>
  let faqItems: ReturnType<typeof parseFaqItemsJson>
  let keyTakeaways: string[] | null
  try {
    secondaryKeywords = parseSecondaryKeywordsJson(input.secondaryKeywordsJson)
    sources = parseSourcesJson(input.sourcesJson)
    faqItems = parseFaqItemsJson(input.faqItemsJson)
    keyTakeaways = parseKeyTakeawaysJson(input.keyTakeawaysJson)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON"
    throw new Error(msg)
  }

  return {
    secondaryKeywords: (secondaryKeywords ?? null) as Prisma.InputJsonValue | null,
    sources: (sources ?? null) as Prisma.InputJsonValue | null,
    faqItems: (faqItems ?? null) as Prisma.InputJsonValue | null,
    keyTakeaways: (keyTakeaways ?? null) as Prisma.InputJsonValue | null,
  }
}

export function resolveReadingTimeMinutes(
  explicit: number | null | undefined,
  content: string | null | undefined,
): number | null {
  if (explicit != null && explicit > 0) return explicit
  return estimateReadingTimeMinutes(content ?? null)
}
