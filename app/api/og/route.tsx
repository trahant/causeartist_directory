import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"
import { createLoader } from "nuqs/server"
import type { ComponentProps } from "react"
import { OgBase } from "~/components/web/og/og-base"
import { siteConfig } from "~/config/site"
import { fonts } from "~/lib/fonts"
import { openGraphSearchParams } from "~/lib/opengraph"

export const contentType = "image/png"
export const alt = "OpenGraph Image"
export const size = { width: 1200, height: 630 }

export async function GET(req: NextRequest) {
  const t = await getTranslations()
  const { title, description, faviconUrl } = createLoader(openGraphSearchParams)(req)

  const params: ComponentProps<typeof OgBase> = {
    title: title ?? siteConfig.name,
    description: description ?? t("brand.description"),
    faviconUrl: faviconUrl ?? `${siteConfig.url}/favicon.png`,
    siteName: siteConfig.name,
    siteTagline: t("brand.tagline"),
  }

  return new ImageResponse(<OgBase {...params} />, {
    width: 1200,
    height: 630,
    fonts,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "CDN-Cache-Control": "max-age=86400",
    },
  })
}
