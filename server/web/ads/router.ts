import { ORPCError } from "@orpc/server"
import { getDomain } from "@primoui/utils"
import z from "zod"
import { AdType, type Prisma } from "~/.generated/prisma/client"
import { fetchAndUploadMedia } from "~/lib/media"
import { baseProcedure } from "~/lib/orpc"
import { adDetailsSchema } from "~/server/web/ads/schema"
import { stripe } from "~/services/stripe"

const createFromCheckout = baseProcedure
  .input(adDetailsSchema)
  .handler(async ({ input: { sessionId, ...adDetails }, context: { db, revalidate } }) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const email = session.customer_details?.email ?? ""
    const ads: Omit<Omit<Prisma.AdCreateInput, "email">, keyof typeof adDetails>[] = []

    if (session.status !== "complete") {
      throw new ORPCError("BAD_REQUEST", { message: "Checkout session is not complete" })
    }

    const adDomain = getDomain(adDetails.websiteUrl)
    const faviconPath = `ads/${adDomain}/favicon`

    // Upload favicon
    const faviconUrl = await fetchAndUploadMedia(adDetails.websiteUrl, faviconPath, "favicon")

    // Check if ads already exist for specific sessionId
    const existingAds = await db.ad.findMany({
      where: { sessionId },
    })

    // If ads already exist, update them
    if (existingAds.length) {
      await db.ad.updateMany({
        where: { sessionId },
        data: { ...adDetails, faviconUrl },
      })

      revalidate({ tags: ["ads"] })

      return { success: true }
    }

    switch (session.mode) {
      case "payment": {
        if (!session.metadata?.ads) {
          throw new ORPCError("BAD_REQUEST", { message: "Invalid session for ad creation" })
        }

        const adsSchema = z.array(
          z.object({
            type: z.enum(AdType),
            startsAt: z.coerce.number().transform(date => new Date(date)),
            endsAt: z.coerce.number().transform(date => new Date(date)),
          }),
        )

        const parsedAds = adsSchema.parse(JSON.parse(session.metadata.ads))
        ads.push(...parsedAds)

        break
      }

      default: {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid session for ad creation" })
      }
    }

    // Create ads in a transaction
    await db.$transaction(
      ads.map(ad => db.ad.create({ data: { ...ad, ...adDetails, email, faviconUrl, sessionId } })),
    )

    revalidate({ tags: ["ads"] })

    return { success: true }
  })

export const webAdRouter = {
  createFromCheckout,
}
