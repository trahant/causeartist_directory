"use server"

import { getDomain, tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { after } from "next/server"
import { ToolStatus } from "~/.generated/prisma/client"
import { isDev } from "~/env"
import { notifySubmitterOfToolSubmitted } from "~/lib/notifications"
import { isRateLimited } from "~/lib/rate-limiter"
import { userActionClient } from "~/lib/safe-actions"
import { generateUniqueSlug } from "~/lib/slugs"
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
    const t = await getTranslations("forms.submit")
    const domain = getDomain(data.websiteUrl)

    // Rate limiting check
    if (user.role !== "admin" && (await isRateLimited("submission"))) {
      throw new Error(t("errors.rate_limited"))
    }

    if (newsletterOptIn) {
      const [firstName, ...restOfName] = user.name.trim().split(/\s+/)
      const lastName = restOfName.join(" ")

      await createResendContact({
        email: user.email,
        firstName,
        lastName,
      })
    }

    // Check if the email domain matches the tool's website domain
    const owner = user.email.includes(domain) ? { connect: { id: user.id } } : undefined

    // Check if the tool already exists
    const existingTool = await db.tool.findFirst({
      where: { websiteUrl: data.websiteUrl },
    })

    // If the tool exists, redirect to the tool or submit page
    if (existingTool) {
      if (owner) {
        // Update the tool with the new owner information
        await db.tool.update({
          where: { id: existingTool.id },
          data: { owner },
        })
      }

      return existingTool
    }

    // Generate a unique slug for the new tool
    const slug = await generateUniqueSlug(data.name, slug =>
      db.tool.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
    )

    // Save the tool to the database with Pending status for user submissions
    const { data: tool, error } = await tryCatch(
      db.tool.create({
        data: {
          ...data,
          submitterEmail: user.email,
          submitterName: user.name,
          slug,
          status: ToolStatus.Pending,
          owner,
        },
      }),
    )

    if (error) {
      throw isDev ? error : new Error(t("errors.failed_submission"))
    }

    // Notify the submitter of the tool submitted
    after(async () => await notifySubmitterOfToolSubmitted(tool))

    return tool
  })
