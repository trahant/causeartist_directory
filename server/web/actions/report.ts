"use server"

import { tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { reportsConfig } from "~/config/reports"
import { isRateLimited } from "~/lib/rate-limiter"
import { actionClient, userActionClient } from "~/lib/safe-actions"
import { createReportToolSchema } from "~/server/web/shared/schema"
import { db } from "~/services/db"

export const reportTool = (reportsConfig.requireSignIn ? userActionClient : actionClient)
  .inputSchema(async () => {
    const t = await getTranslations("schema")
    return createReportToolSchema(t)
  })
  .action(async ({ parsedInput: { toolId, type, email, message } }) => {
    // Rate limiting check
    if (await isRateLimited("report")) {
      throw new Error("Too many requests. Please try again later.")
    }

    const result = await tryCatch(
      db.report.create({
        data: {
          type,
          email,
          message,
          toolId,
        },
      }),
    )

    if (result.error) {
      console.error("Failed to report tool:", result.error)
      return { success: false, error: "Failed to report tool. Please try again later." }
    }

    return { success: true }
  })
