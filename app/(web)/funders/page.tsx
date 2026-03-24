import type { Metadata } from "next"
import { Suspense, cache } from "react"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { FunderDirectoryQuery } from "~/components/web/directory/funder-directory-query"
import { EntityDirectoryListingSkeleton } from "~/components/web/directory/entity-directory-listing"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"

const url = "/funders"
const title = "Impact Funders Directory"
const description =
  "Browse impact investors, foundations, and family offices funding the next generation of impact companies."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Funders" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

export default async function FundersPage(props: PageProps<"/funders">) {
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          <Suspense fallback={<EntityDirectoryListingSkeleton />}>
            <FunderDirectoryQuery searchParams={props.searchParams} />
          </Suspense>
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
