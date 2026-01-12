"use server"

import { getDomain, normalizeUrl, tryCatch } from "@primoui/utils"
import { after } from "next/server"
import { getTranslations } from "next-intl/server"
import { ToolStatus } from "~/.generated/prisma/client"
import { isDev } from "~/env"
import { isBlockedDomain } from "~/lib/blocked-domains"
import { checkUrlAvailability } from "~/lib/http"
import { notifySubmitterOfToolSubmitted } from "~/lib/notifications"
import { isRateLimited } from "~/lib/rate-limiter"
import { userActionClient } from "~/lib/safe-actions"
import { createSubmitToolSchema } from "~/server/web/shared/schema"
import { db } from "~/services/db"
import { createResendContact } from "~/services/resend"

/**
 * Submit a tool to the database
 * @param input - The tool data to submit
 * @returns The tool that was submitted
 */
export const submitTool = userActionClient
  .inputSchema(async () => {
    const t = await getTranslations("schema")
    return createSubmitToolSchema(t)
  })
  .action(async ({ parsedInput: { newsletterOptIn, ...data }, ctx: { user } }) => {
    const t = await getTranslations("forms.submit.errors")
    const domain = getDomain(data.websiteUrl)
    const websiteUrl = normalizeUrl(data.websiteUrl)

    // Check for blocked domains (temporary hosting providers)
    if (isBlockedDomain(domain)) {
      throw new Error(t("blocked_domain"))
    }

    // Check if the website URL is accessible
    const isUrlAccessible = await checkUrlAvailability(websiteUrl)
    if (!isUrlAccessible) {
      throw new Error(t("url_not_accessible"))
    }

    // Rate limiting check
    if (await isRateLimited("submission")) {
      throw new Error(t("rate_limited"))
    }

    if (newsletterOptIn && user.name) {
      const [firstName, ...restOfName] = user.name.trim().split(/\s+/)
      const lastName = restOfName.join(" ")

      await createResendContact({
        email: user.email,
        firstName,
        lastName,
      })
    }

    // Check if the email domain matches the tool's website domain
    const ownerId = user.email.includes(domain) ? user.id : undefined

    // Check if the tool already exists
    const existingTool = await db.tool.findFirst({
      where: { websiteUrl },
    })

    // If the tool exists, redirect to the tool or submit page
    if (existingTool) {
      if (!existingTool.submitterEmail) {
        // Update the tool with the new submitter information from authenticated user
        await db.tool.update({
          where: { id: existingTool.id },
          data: {
            submitterEmail: user.email,
            submitterName: user.name,
            submitterNote: data.submitterNote,
            ownerId,
          },
        })
      }

      return existingTool
    }

    // Save the tool to the database with Pending status for user submissions
    const { data: tool, error } = await tryCatch(
      db.tool.create({
        data: {
          name: data.name,
          websiteUrl,
          submitterEmail: user.email,
          submitterName: user.name,
          submitterNote: data.submitterNote,
          slug: "",
          ownerId,
          status: ToolStatus.Pending,
        },
      }),
    )

    if (error) {
      throw isDev ? error : new Error(t("failed_submission"))
    }

    // Notify the submitter of the tool submitted
    after(async () => await notifySubmitterOfToolSubmitted(tool))

    return tool
  })
