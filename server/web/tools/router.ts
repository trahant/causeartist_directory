import { getDomain, tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { after } from "next/server"
import { z } from "zod"
import { ToolStatus } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { EmailVerifyDomain } from "~/emails/verify-domain"
import { auth } from "~/lib/auth"
import { sendEmail } from "~/lib/email"
import { isDev } from "~/env"
import { notifySubmitterOfToolSubmitted } from "~/lib/notifications"
import { authedProcedure } from "~/lib/orpc"
import { isRateLimited } from "~/lib/rate-limiter"
import { generateUniqueSlug } from "~/lib/slugs"
import { createResendContact } from "~/services/resend"

/**
 * Get tool by slug and verify it's claimable
 */
const getClaimableTool = async (db: typeof import("~/services/db").db, id: string) => {
  const tool = await db.tool.findUnique({
    where: { id },
  })

  if (!tool) {
    throw new Error("Tool not found")
  }

  if (tool.ownerId) {
    throw new Error("This tool has already been claimed")
  }

  return tool
}

/**
 * Verify that email domain matches tool website domain
 */
const verifyEmailDomain = (email: string, toolWebsiteUrl: string) => {
  const toolDomain = getDomain(toolWebsiteUrl)
  const emailDomain = email.split("@")[1]

  if (toolDomain !== emailDomain) {
    throw new Error("Email domain must match the tool's website domain")
  }
}

/**
 * Generate and send OTP email
 */
const generateAndSendOtp = async (email: string) => {
  const { token: otp } = await auth.api.generateOneTimeToken({
    headers: await headers(),
  })

  if (!otp) {
    throw new Error("Failed to send OTP")
  }

  // Send OTP email
  after(async () => {
    const to = email
    const subject = `Your ${siteConfig.name} Verification Code`
    await sendEmail({ to, subject, react: EmailVerifyDomain({ to, otp }) })
  })

  return otp
}

// -----------------------------------------------------------------------------
// Submit tool
// -----------------------------------------------------------------------------
const submit = authedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      websiteUrl: z.url({ protocol: /^https?$/, normalize: true }).min(1),
      submitterNote: z.string().max(256),
      newsletterOptIn: z.boolean().optional().default(true),
    }),
  )
  .handler(async ({ input: { newsletterOptIn, ...data }, context: { user, db } }) => {
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

// -----------------------------------------------------------------------------
// Send OTP to verify domain ownership
// -----------------------------------------------------------------------------
const sendClaimOtp = authedProcedure
  .input(
    z.object({
      toolId: z.string(),
      email: z.email(),
    }),
  )
  .handler(async ({ input: { toolId, email }, context: { user, db } }) => {
    // Rate limiting check
    if (await isRateLimited("claim", "claim-otp", user.id)) {
      throw new Error("Too many requests. Please try again later")
    }

    // Get and validate tool
    const tool = await getClaimableTool(db, toolId)

    // Verify email domain
    verifyEmailDomain(email, tool.websiteUrl)

    // Generate and send OTP
    await generateAndSendOtp(email)

    return { success: true }
  })

// -----------------------------------------------------------------------------
// Verify OTP and claim tool
// -----------------------------------------------------------------------------
const verifyClaimOtp = authedProcedure
  .input(
    z.object({
      toolId: z.string(),
      otp: z.string().length(6),
    }),
  )
  .handler(async ({ input: { toolId, otp }, context: { user, db, revalidate } }) => {
    // Rate limiting check
    if (await isRateLimited("claim", "claim-verify", user.id)) {
      throw new Error("Too many requests. Please try again later")
    }

    // Get and validate tool
    const tool = await getClaimableTool(db, toolId)

    // Verify otp
    await auth.api.verifyOneTimeToken({ body: { token: otp } })

    // Claim tool for user
    await db.tool.update({
      where: { id: tool.id },
      data: { ownerId: user.id },
    })

    // Revalidate tools
    revalidate({
      tags: ["tools", `tool-${tool.slug}`],
    })

    return { success: true }
  })

export const webToolRouter = {
  submit,
  sendClaimOtp,
  verifyClaimOtp,
}
