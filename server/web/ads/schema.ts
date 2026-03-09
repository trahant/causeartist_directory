import { z } from "zod"

export const adDetailsSchema = z.object({
  sessionId: z.string(),
  name: z.string().min(1),
  description: z.string().min(1).max(160),
  websiteUrl: z.url({ protocol: /^https?$/, normalize: true }),
  buttonLabel: z.string().optional(),
})
