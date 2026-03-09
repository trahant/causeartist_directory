import { cacheLife, cacheTag } from "next/cache"
import { getTranslations } from "next-intl/server"
import type { Prisma } from "~/.generated/prisma/client"
import { AdType } from "~/.generated/prisma/client"
import { adsConfig } from "~/config/ads"
import { siteConfig } from "~/config/site"
import { adManyPayload, adOnePayload, type AdOne } from "~/server/web/ads/payloads"
import { db } from "~/services/db"

export const findAds = async ({ orderBy, ...args }: Prisma.AdFindManyArgs) => {
  "use cache"

  cacheTag("ads")
  cacheLife("hours")

  return db.ad.findMany({
    ...args,
    orderBy: orderBy ?? { startsAt: "asc" },
    select: adManyPayload,
  })
}

export const findActiveAds = async ({ where, orderBy, ...args }: Prisma.AdFindManyArgs) => {
  "use cache"

  cacheTag("ads")
  cacheLife("hours")

  return db.ad.findMany({
    ...args,
    orderBy: orderBy ?? { startsAt: "asc" },
    where: { startsAt: { lte: new Date() }, endsAt: { gt: new Date() }, ...where },
    select: adOnePayload,
  })
}

/**
 * Finds an ad based on the provided parameters with fallback logic.
 * Standalone function usable from both oRPC router and server components.
 */
export const findAdWithFallback = async ({
  type,
  explicitAd,
  fallback = ["all", "default"],
}: {
  type: AdType
  explicitAd?: AdOne | null
  fallback?: ("all" | "default")[]
}): Promise<AdOne | null> => {
  const t = await getTranslations("ads")
  let ads: AdOne[] = []

  const defaultAd = {
    id: siteConfig.slug,
    type: AdType.All,
    websiteUrl: `${siteConfig.url}/advertise`,
    name: t("default_ad.name"),
    description: t("default_ad.description"),
    buttonLabel: t("default_ad.button_label", { siteName: siteConfig.name }),
    faviconUrl: "/favicon.png",
    bannerUrl: null,
  } satisfies AdOne

  if (!adsConfig.enabled) {
    return null
  }

  if (explicitAd !== undefined) {
    return explicitAd as AdOne | null
  }

  if (type) {
    ads = await findActiveAds({ where: { type } })
  }

  if (!ads.length && fallback.includes("all")) {
    ads = await findActiveAds({ where: { type: "All" } })
  }

  if (!ads.length && fallback.includes("default")) {
    return defaultAd
  }

  if (!ads.length) {
    return null
  }

  if (ads.length === 1) {
    return ads[0]
  }

  return ads[Math.floor(Math.random() * ads.length)]
}
