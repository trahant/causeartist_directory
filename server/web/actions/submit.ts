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
    const domain = getDomain(data.websiteUrl)
    const websiteUrl = normalizeUrl(data.websiteUrl)

    // Check for blocked domains (temporary hosting providers)
    if (isBlockedDomain(domain)) {
      throw new Error(
        "Temporary hosting domains (e.g. vercel.app, netlify.app) are not allowed. Please use a custom domain.",
      )
    }

    // Check if the website URL is accessible
    const isUrlAccessible = await checkUrlAvailability(websiteUrl)
    if (!isUrlAccessible) {
      throw new Error("Website URL is not accessible. Please check the URL and try again.")
    }

    // Rate limiting check
    if (await isRateLimited("submission")) {
      throw new Error("Too many submissions. Please try again later.")
    }

    if (newsletterOptIn) {
      const [firstName, ...restOfName] = data.submitterName.trim().split(/\s+/)
      const lastName = restOfName.join(" ")

      await createResendContact({
        email: data.submitterEmail,
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
        const { submitterEmail, submitterName, submitterNote } = data

        // Update the tool with the new submitter information
        await db.tool.update({
          where: { id: existingTool.id },
          data: { submitterEmail, submitterName, submitterNote, ownerId },
        })
      }

      return existingTool
    }

    // Save the tool to the database with Pending status for user submissions
    const { data: tool, error } = await tryCatch(
      db.tool.create({
        data: { ...data, slug: "", websiteUrl, ownerId, status: ToolStatus.Pending },
      }),
    )

    if (error) {
      throw isDev ? error : new Error("Failed to submit tool")
    }

    // Notify the submitter of the tool submitted
    after(async () => await notifySubmitterOfToolSubmitted(tool))

    return tool
  })
