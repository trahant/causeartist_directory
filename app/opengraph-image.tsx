import { ImageResponse } from "next/og"
import { getTranslations } from "next-intl/server"
import { OgBase } from "~/components/web/og/og-base"
import { siteConfig } from "~/config/site"
import { fonts } from "~/lib/fonts"

export const alt = siteConfig.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const t = await getTranslations()
  return new ImageResponse(
    (
      <OgBase
        title={siteConfig.name}
        description={t("brand.description")}
        faviconUrl={`${siteConfig.url}/favicon.png`}
        siteName={siteConfig.name}
        siteTagline={t("brand.tagline")}
      />
    ),
    {
      ...size,
      fonts,
    },
  )
}
