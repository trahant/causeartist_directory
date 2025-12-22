import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { cache, Suspense } from "react"
import { DashboardToolListing } from "~/app/(web)/dashboard/listing"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { siteConfig } from "~/config/site"
import { getPageData, getPageMetadata } from "~/lib/pages"

// I18n page namespace
const namespace = "pages.dashboard"

// Get page data
const getData = cache(async () => {
  const t = await getTranslations()
  const url = "/dashboard"
  const title = t(`${namespace}.title`)
  const description = t(`${namespace}.description`, { siteName: siteConfig.name })

  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title }],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url, metadata } = await getData()
  return getPageMetadata({ url, metadata })
}

export default async function (props: PageProps<"/dashboard">) {
  const { metadata } = await getData()

  return (
    <>
      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <div className="flex flex-col gap-4">
        <Suspense fallback={<DataTableSkeleton />}>
          <DashboardToolListing {...props} />
        </Suspense>
      </div>
    </>
  )
}
