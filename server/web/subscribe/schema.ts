import { z } from "zod"

export const newsletterSchema = z.object({
  captcha: z.literal("").optional(),
  email: z.email(),
})

export type NewsletterSchema = z.infer<typeof newsletterSchema>
