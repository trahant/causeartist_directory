import { z } from "zod"

export const contactFormSchema = z.object({
  captcha: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  message: z.string().trim().min(10).max(8000),
  newsletterOptIn: z.boolean().optional().default(false),
})

export type ContactFormSchema = z.infer<typeof contactFormSchema>
