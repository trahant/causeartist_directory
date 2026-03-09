import { z } from "zod"

export const bookmarkInputSchema = z.object({
  toolId: z.string().min(1),
})
