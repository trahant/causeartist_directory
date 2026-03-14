import { getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { Hero } from "~/app/(web)/(home)/hero"
import { StructuredData } from "~/components/web/structured-data"
import { ToolListingSkeleton } from "~/components/web/tools/tool-listing"
import { ToolQuery } from "~/components/web/tools/tool-query"
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

      <Suspense fallback={<ToolListingSkeleton />}>
        <ToolQuery searchParams={props.searchParams} options={{ enableFilters: true }} ad="Tools" />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
