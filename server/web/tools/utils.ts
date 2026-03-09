import { ORPCError } from "@orpc/server"
import { getDomain } from "@primoui/utils"
import { headers } from "next/headers"
import { after } from "next/server"
import { siteConfig } from "~/config/site"
import { EmailVerifyDomain } from "~/emails/verify-domain"
import { auth } from "~/lib/auth"
import { sendEmail } from "~/lib/email"
import type { db } from "~/services/db"

/**
 * Get tool by id and verify it's claimable (exists and unclaimed)
 */
export const getClaimableTool = async (prisma: typeof db, id: string) => {
  const tool = await prisma.tool.findUnique({
    where: { id },
  })

  if (!tool) {
    throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
  }

  if (tool.ownerId) {
    throw new ORPCError("CONFLICT", { message: "This tool has already been claimed" })
  }

  return tool
}

/**
 * Verify that email domain matches tool website domain
 */
export const verifyEmailDomain = (email: string, toolWebsiteUrl: string) => {
  const toolDomain = getDomain(toolWebsiteUrl)
  const emailDomain = email.split("@")[1]

  if (toolDomain !== emailDomain) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Email domain must match the tool's website domain",
    })
  }
}

/**
 * Generate OTP and send verification email
 */
export const generateAndSendOtp = async (email: string) => {
  const { token: otp } = await auth.api.generateOneTimeToken({
    headers: await headers(),
  })

  if (!otp) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to generate OTP" })
  }

  after(async () => {
    const to = email
    const subject = `Your ${siteConfig.name} Verification Code`
    await sendEmail({ to, subject, react: EmailVerifyDomain({ to, otp }) })
  })

  return otp
}
