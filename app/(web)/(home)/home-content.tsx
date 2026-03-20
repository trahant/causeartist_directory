import { getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { Hero } from "~/app/(web)/(home)/hero"
import { DirectoryListingSkeleton } from "~/components/web/directory/directory-listing"
import { DirectoryQuery } from "~/components/web/directory/directory-query"
import { StructuredData } from "~/components/web/structured-data"
import { siteConfig } from "~/config/site"
import { getPageData } from "~/lib/pages"

const getData = cache(async () => {
  const t = await getTranslations()
  const title = `${siteConfig.name} - ${t("brand.tagline")}`
  const description = t("brand.description")

  return getPageData(siteConfig.url, title, description)
})

export async function HomeContent(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { structuredData } = await getData()

  return (
    <>
      <Hero />

      <Suspense fallback={<DirectoryListingSkeleton />}>
        <DirectoryQuery searchParams={props.searchParams} />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
