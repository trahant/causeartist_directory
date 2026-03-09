import { ORPCError } from "@orpc/server"
import { getDomain, tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { after } from "next/server"
import { z } from "zod"
import { ToolStatus } from "~/.generated/prisma/client"
import { isDev } from "~/env"
import { auth } from "~/lib/auth"
import { notifySubmitterOfToolSubmitted } from "~/lib/notifications"
import { authedProcedure } from "~/lib/orpc"
import { isRateLimited } from "~/lib/rate-limiter"
import { generateUniqueSlug } from "~/lib/slugs"
import { getClaimableTool, generateAndSendOtp, verifyEmailDomain } from "~/server/web/tools/utils"
import { createResendContact } from "~/services/resend"

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

    if (user.role !== "admin" && (await isRateLimited("submission"))) {
      throw new ORPCError("TOO_MANY_REQUESTS", { message: t("errors.rate_limited") })
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

    const owner = user.email.includes(domain) ? { connect: { id: user.id } } : undefined

    const existingTool = await db.tool.findFirst({
      where: { websiteUrl: data.websiteUrl },
    })

    if (existingTool) {
      if (owner) {
        await db.tool.update({
          where: { id: existingTool.id },
          data: { owner },
        })
      }

      return existingTool
    }

    const slug = await generateUniqueSlug(data.name, slug =>
      db.tool.findUnique({ where: { slug }, select: { slug: true } }).then(Boolean),
    )

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
    if (await isRateLimited("claim", "claim-otp", user.id)) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "Too many requests. Please try again later",
      })
    }

    const tool = await getClaimableTool(db, toolId)
    verifyEmailDomain(email, tool.websiteUrl)
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
    if (await isRateLimited("claim", "claim-verify", user.id)) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "Too many requests. Please try again later",
      })
    }

    const tool = await getClaimableTool(db, toolId)
    await auth.api.verifyOneTimeToken({ body: { token: otp } })

    await db.tool.update({
      where: { id: tool.id },
      data: { ownerId: user.id },
    })

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
