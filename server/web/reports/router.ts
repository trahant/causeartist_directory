import { ORPCError } from "@orpc/server"
import { tryCatch } from "@primoui/utils"
import { baseProcedure } from "~/lib/orpc"
import { isRateLimited } from "~/lib/rate-limiter"
import { reportToolSchema } from "~/server/web/reports/schema"

const report = baseProcedure
  .input(reportToolSchema)
  .handler(async ({ input: { toolId, type, email, message }, context: { db } }) => {
    if (await isRateLimited("report")) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "Too many requests. Please try again later.",
      })
    }

    const { error } = await tryCatch(
      db.report.create({
        data: {
          type,
          email,
          message,
          toolId,
        },
      }),
    )

    if (error) {
      console.error("Failed to report tool:", error)
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to report tool. Please try again later.",
      })
    }

    return { success: true }
  })

export const reportRouter = {
  report,
}
