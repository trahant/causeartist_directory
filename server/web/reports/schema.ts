import { z } from "zod"
import { ReportType } from "~/.generated/prisma/browser"

export const reportToolSchema = z
  .object({
    type: z.enum(ReportType),
    email: z.email(),
    message: z.string().max(256),
    toolId: z.string(),
  })
  .refine(data => data.type !== ReportType.Other || data.message.length > 0, {
    path: ["message"],
  })

export type ReportToolSchema = z.infer<typeof reportToolSchema>
