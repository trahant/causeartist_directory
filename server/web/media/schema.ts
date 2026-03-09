import { z } from "zod"

export const fetchMediaSchema = z.object({
  url: z.url({ protocol: /^https?$/, normalize: true }),
  path: z.string().regex(/^[a-z0-9/_-]+$/i),
  type: z.enum(["favicon", "screenshot"]).default("favicon"),
})

export const uploadMediaSchema = z.object({
  path: z.string().regex(/^[a-z0-9/_-]+$/i),
  base64: z.string().min(1),
  mimeType: z.string().refine(type => /^image\/(jpeg|jpg|png|webp|avif)$/.test(type), {
    message: "Invalid file type",
  }),
})
