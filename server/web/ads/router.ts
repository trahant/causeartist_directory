import { getDomain } from "@primoui/utils"
import { getTranslations } from "next-intl/server"
import z from "zod"
import { AdType, type Prisma } from "~/.generated/prisma/client"
import { fetchAndUploadMedia } from "~/lib/media"
import { baseProcedure } from "~/lib/orpc"
import { findAdWithFallback } from "~/server/web/ads/queries"
import { createAdDetailsSchema } from "~/server/web/shared/schema"
import { stripe } from "~/services/stripe"

const findWithFallbackSchema = z.object({
  type: z.enum(AdType),
  explicitAd: z
    .object({
      type: z.enum(AdType),
      websiteUrl: z.url(),
      name: z.string(),
      description: z.string().nullish(),
      buttonLabel: z.string().nullish(),
      faviconUrl: z.url().nullish(),
      bannerUrl: z.url().nullish(),
    })
    .nullish(),
  fallback: z.array(z.enum(["all", "default"])).default(["all", "default"]),
})

const findWithFallback = baseProcedure
  .input(findWithFallbackSchema)
  .handler(async ({ input: { type, explicitAd, fallback } }) => {
    return findAdWithFallback({ type, explicitAd, fallback })
  })

const createFromCheckout = baseProcedure
  .input(async () => {
    const t = await getTranslations("schema")
    return createAdDetailsSchema(t)
  })
  .handler(async ({ input: { sessionId, ...adDetails }, context: { db, revalidate } }) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const email = session.customer_details?.email ?? ""
    const ads: Omit<Omit<Prisma.AdCreateInput, "email">, keyof typeof adDetails>[] = []

    if (session.status !== "complete") {
      throw new Error("Checkout session is not complete")
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

      // Revalidate the cache
      revalidate({ tags: ["ads"] })

      return { success: true }
    }

    switch (session.mode) {
      // Handle one-time payment ads
      case "payment": {
        if (!session.metadata?.ads) {
          throw new Error("Invalid session for ad creation")
        }

        const adsSchema = z.array(
          z.object({
            type: z.enum(AdType),
            startsAt: z.coerce.number().transform(date => new Date(date)),
            endsAt: z.coerce.number().transform(date => new Date(date)),
          }),
        )

        // Parse the ads from the session metadata
        const parsedAds = adsSchema.parse(JSON.parse(session.metadata.ads))

        // Add ads to create later
        ads.push(...parsedAds)

        break
      }

      default: {
        throw new Error("Invalid session for ad creation")
      }
    }

    // Create ads in a transaction
    await db.$transaction(
      ads.map(ad => db.ad.create({ data: { ...ad, ...adDetails, email, faviconUrl, sessionId } })),
    )

    // Revalidate the cache
    revalidate({ tags: ["ads"] })

    return { success: true }
  })

export const webAdRouter = {
  findWithFallback,
  createFromCheckout,
}
