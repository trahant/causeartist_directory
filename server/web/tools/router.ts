import { getDomain, tryCatch } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import { after } from "next/server"
import { z } from "zod"
import { ToolStatus } from "~/.generated/prisma/client"
import { isDev } from "~/env"
import { auth } from "~/lib/auth"
import { notifySubmitterOfToolSubmitted } from "~/lib/notifications"
import { withAuthRateLimit, withBase } from "~/lib/orpc"
import { generateUniqueSlug } from "~/lib/slugs"
import { findCategories } from "~/server/web/categories/queries"
import { generateAndSendOtp, getClaimableTool, verifyEmailDomain } from "~/server/web/tools/utils"
import { createResendContact } from "~/services/resend"

const submit = withAuthRateLimit("submission")
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

    if (newsletterOptIn) {
      const [firstName, ...restOfName] = user.name.trim().split(/\s+/)
      const lastName = restOfName.join(" ")
      const { error: newsletterError } = await tryCatch(
        createResendContact({
          email: user.email,
          firstName,
          lastName,
        }),
      )
      if (newsletterError) {
        console.warn("Tool submit: newsletter signup skipped:", newsletterError)
      }
    }

    const domain = getDomain(data.websiteUrl)
    const owner = user.email.includes(domain) ? { connect: { id: user.id } } : undefined

    const existingTool = await db.tool.findFirst({
      where: { websiteUrl: data.websiteUrl },
    })

    if (existingTool) {
      // Return the existing tool with updated data
      return await db.tool.update({
        where: { id: existingTool.id },
        data: {
          submitterEmail: user.email,
          submitterName: user.name,
          submitterNote: data.submitterNote,
          ...(owner && { owner }),
        },
      })
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

const sendClaimOtp = withAuthRateLimit("claim", "claim-otp")
  .input(
    z.object({
      toolId: z.string(),
      email: z.email(),
    }),
  )
  .handler(async ({ input: { toolId, email }, context: { db } }) => {
    const tool = await getClaimableTool(db, toolId)
    verifyEmailDomain(email, tool.websiteUrl)
    await generateAndSendOtp(email)

    return { success: true }
  })

const verifyClaimOtp = withAuthRateLimit("claim", "claim-verify")
  .input(
    z.object({
      toolId: z.string(),
      otp: z.string().length(6),
    }),
  )
  .handler(async ({ input: { toolId, otp }, context: { user, db, revalidate } }) => {
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

const findFilterOptions = withBase.handler(async () => {
  const categories = await findCategories({})

  return [
    {
      type: "category" as const,
      options: categories.map(({ slug, name, _count }) => ({
        slug,
        name,
        count: _count.tools,
      })),
    },
  ].filter(({ options }) => options.length)
})

export const toolRouter = {
  findFilterOptions,
  submit,
  sendClaimOtp,
  verifyClaimOtp,
}
