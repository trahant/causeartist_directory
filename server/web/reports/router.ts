import { ORPCError } from "@orpc/server"
import { tryCatch } from "@primoui/utils"
import { withRateLimit } from "~/lib/orpc"
import { reportToolSchema } from "~/server/web/reports/schema"

const report = withRateLimit("report")
  .input(reportToolSchema)
  .handler(async ({ input: { toolId, type, email, message }, context: { db } }) => {
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
