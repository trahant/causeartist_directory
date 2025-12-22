import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"
import { createLoader } from "nuqs/server"
import { OgBase } from "~/components/web/og/og-base"
import { siteConfig } from "~/config/site"
import { loadGoogleFont } from "~/lib/fonts"
import { openGraphSearchParams } from "~/lib/opengraph"
import { ComponentProps } from "react"

export const contentType = "image/png"
export const alt = "OpenGraph Image"
export const size = { width: 1200, height: 630 }

export const GET = async (req: NextRequest) => {
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
    fonts: [
      {
        name: "Geist",
        data: await loadGoogleFont("Geist", 400),
        weight: 400,
        style: "normal",
      },
      {
        name: "GeistBold",
        data: await loadGoogleFont("Geist", 600),
        weight: 600,
        style: "normal",
      },
    ],
  })
}
