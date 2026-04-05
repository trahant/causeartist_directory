import { ImageResponse } from "next/og"
import { getTranslations } from "next-intl/server"
import { OgBase } from "~/components/web/og/og-base"
import { siteConfig } from "~/config/site"
import { fonts } from "~/lib/fonts"
import { findCompany } from "~/server/web/companies/queries"

export const alt = "Company profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTranslations()
  const company = await findCompany({ where: { slug, status: "published" } })

  const title = company?.name ?? "Impact Company"
  const sectorLine =
    company?.sectors?.length ?
      company.sectors
        .map(s => s.sector.name)
        .slice(0, 3)
        .join(" · ")
    : ""
  const description =
    [company?.tagline, sectorLine].filter(Boolean).join(" · ") ||
    company?.description?.slice(0, 220) ||
    `Impact company profile on ${siteConfig.name}.`
  const faviconUrl = company?.logoUrl ?? `${siteConfig.url}/favicon.png`

  return new ImageResponse(
    (
      <OgBase
        title={title}
        description={description}
        faviconUrl={faviconUrl}
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
