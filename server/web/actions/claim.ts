"use server"

import { getDomain } from "@primoui/utils"
import { updateTag } from "next/cache"
import { headers } from "next/headers"
import { after } from "next/server"
import { getTranslations } from "next-intl/server"
import { siteConfig } from "~/config/site"
import { EmailVerifyDomain } from "~/emails/verify-domain"
import { auth } from "~/lib/auth"
import { sendEmail } from "~/lib/email"
import { isRateLimited } from "~/lib/rate-limiter"
import { userActionClient } from "~/lib/safe-actions"
import { createClaimToolEmailSchema, createClaimToolOtpSchema } from "~/server/web/shared/schema"
import { db } from "~/services/db"

/**
 * Get tool by slug and verify it's claimable
 */
const getClaimableTool = async (id: string) => {
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

/**
 * Claim tool for a user and revalidate cache
 */
const claimToolForUser = async (toolId: string, userId: string) => {
  const tool = await db.tool.update({
    where: { id: toolId },
    data: { ownerId: userId },
  })

  // Revalidate tools
  updateTag("tools", "infinite")
  updateTag(`tool-${tool.slug}`, "infinite")
}

/**
 * Send OTP to verify domain ownership
 */
export const sendToolClaimOtp = userActionClient
  .inputSchema(async () => {
    const t = await getTranslations("schema")
    return createClaimToolEmailSchema(t)
  })
  .action(async ({ parsedInput: { toolId, email }, ctx: { user } }) => {
    // Rate limiting check
    if (await isRateLimited("claim", "claim-otp", user.id)) {
      throw new Error("Too many requests. Please try again later")
    }

    // Get and validate tool
    const tool = await getClaimableTool(toolId)

    // Verify email domain
    verifyEmailDomain(email, tool.websiteUrl)

    // Generate and send OTP
    await generateAndSendOtp(email)

    return { success: true }
  })

/**
 * Verify OTP and claim tool
 */
export const verifyToolClaimOtp = userActionClient
  .inputSchema(async () => {
    const t = await getTranslations("schema")
    return createClaimToolOtpSchema(t)
  })
  .action(async ({ parsedInput: { toolId, otp }, ctx: { user } }) => {
    // Rate limiting check
    if (await isRateLimited("claim", "claim-verify", user.id)) {
      throw new Error("Too many requests. Please try again later")
    }

    // Get and validate tool
    const tool = await getClaimableTool(toolId)

    // Verify otp
    await auth.api.verifyOneTimeToken({ body: { token: otp } })

    // Claim tool and revalidate
    await claimToolForUser(tool.id, user.id)

    return { success: true }
  })
