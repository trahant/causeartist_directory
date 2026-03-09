import { ORPCError } from "@orpc/server"
import { tryCatch } from "@primoui/utils"
import { baseProcedure } from "~/lib/orpc"
import { isRateLimited } from "~/lib/rate-limiter"
import { newsletterSchema } from "~/server/web/subscribe/schema"
import { createResendContact } from "~/services/resend"

const subscribe = baseProcedure.input(newsletterSchema).handler(async ({ input: { email } }) => {
  if (await isRateLimited("newsletter")) {
    throw new ORPCError("TOO_MANY_REQUESTS", {
      message: "Too many requests. Please try again later.",
    })
  }

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
