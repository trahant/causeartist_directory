"use server"

import { tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { isRateLimited } from "~/lib/rate-limiter"
import { actionClient } from "~/lib/safe-actions"
import { createNewsletterSchema } from "~/server/web/shared/schema"
import { createResendContact } from "~/services/resend"

/**
 * Subscribe to the newsletter
 * @param input - The newsletter data to subscribe to
 * @returns The newsletter that was subscribed to
 */
export const subscribeToNewsletter = actionClient
  .inputSchema(async () => {
    const t = await getTranslations("schema")
    return createNewsletterSchema(t)
  })
  .action(async ({ parsedInput: { email } }) => {
    const t = await getTranslations("forms.subscribe")

    // Rate limiting check
    if (await isRateLimited("newsletter")) {
      throw new Error(t("errors.rate_limited"))
    }

    // Create a resend contact
    const { error } = await tryCatch(createResendContact({ email }))

    if (error) {
      console.error("Failed to create resend contact:", error)
      throw new Error(t("errors.failed"))
    }

    return t("success_message")
  })
