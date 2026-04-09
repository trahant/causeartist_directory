import type { Metadata } from "next"
import { cache } from "react"
import { AlternativeTargetCardGrid } from "~/components/web/alternatives/alternative-target-card-grid"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findAlternativeTargets } from "~/server/web/alternatives/queries"

const url = "/alternatives"
const title = "Responsible Alternatives Directory"
const description =
  "Browse curated alternatives to major brands and discover purpose-driven company profiles."

const getData = cache(async () => {
  const targets = await findAlternativeTargets()
  const pageData = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Alternatives" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { targets, ...pageData }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

export default async function AlternativesPage() {
  const { metadata, breadcrumbs, structuredData, targets } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          <AlternativeTargetCardGrid items={targets} />
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
