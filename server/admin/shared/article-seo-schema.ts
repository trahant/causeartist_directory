import * as z from "zod"

/** Shared optional SEO/AIO fields for blog posts and case studies (admin upsert). */
export const articleSeoFormFieldsSchema = z.object({
  canonicalUrl: z.string().max(2000).optional().nullable(),
  ogImageUrl: z.string().max(2000).optional().nullable(),
  ogImageAlt: z.string().max(300).optional().nullable(),
  metaRobots: z.string().max(200).optional().nullable(),
  focusKeyword: z.string().max(200).optional().nullable(),
  secondaryKeywordsJson: z.string().optional().nullable(),
  lastReviewedAt: z.coerce.date().optional().nullable(),
  reviewedBy: z.string().max(200).optional().nullable(),
  sourcesJson: z.string().optional().nullable(),
  faqItemsJson: z.string().optional().nullable(),
  keyTakeawaysJson: z.string().optional().nullable(),
  readingTimeMinutes: z.number().int().positive().max(999).optional().nullable(),
  contentType: z.string().max(40).optional().nullable(),
})
