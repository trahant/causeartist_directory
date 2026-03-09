import { ORPCError } from "@orpc/server"
import { tryCatch } from "@primoui/utils"
import { withRateLimit } from "~/lib/orpc"
import { newsletterSchema } from "~/server/web/subscribe/schema"
import { createResendContact } from "~/services/resend"

const subscribe = withRateLimit("newsletter")
  .input(newsletterSchema)
  .handler(async ({ input: { email } }) => {
    const { error } = await tryCatch(createResendContact({ email }))

    if (error) {
      console.error("Failed to create resend contact:", error)
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to subscribe. Please try again later.",
      })
    }

    return { success: true }
  })

export const subscribeRouter = {
  subscribe,
}
