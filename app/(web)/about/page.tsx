import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { cache } from "react"
import { AboutContent } from "~/components/web/about/about-content"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateAboutPage } from "~/lib/structured-data"

// I18n page namespace
const namespace = "pages.about"

// Get page data
const getData = cache(async () => {
  const t = await getTranslations()
  const url = "/about"
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`, { siteName: siteConfig.name })

  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title }],
    structuredData: [generateAboutPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url, metadata } = await getData()
  return getPageMetadata({ url, metadata })
}

export default async function () {
  const { breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <AboutContent />

      <StructuredData data={structuredData} />
    </>
  )
}
