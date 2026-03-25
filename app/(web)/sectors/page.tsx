import type { Metadata } from "next"
import { cache } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { activeSectorsWhere } from "~/server/web/sectors/retired"
import { db } from "~/services/db"

const url = "/sectors"
const title = "Sectors | Impact Companies & Investors | Causeartist"
const description =
  "Browse sectors across impact companies and funders. Open a sector to see listings and matching investors."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/", title: "Home" },
      { url, title: "Sectors" },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

export default async function SectorsHubPage() {
  const sectors = await db.sector.findMany({
    where: activeSectorsWhere(),
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, heroText: true },
  })

  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {sectors.length === 0 ? (
            <p className="text-muted-foreground">No sectors found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {sectors.map(sector => (
                <Card key={sector.id} asChild>
                  <Link href={`/companies/sector/${sector.slug}`}>
                    <CardHeader>
                      <span className="font-semibold text-sm">{sector.name}</span>
                    </CardHeader>
                    <CardDescription>
                      {sector.heroText ??
                        "Explore published impact companies in this sector. Matching funders are listed under the same sector on Funders."}
                    </CardDescription>
                    <CardFooter>
                      <span className="text-muted-foreground text-sm">Browse companies in this sector</span>
                    </CardFooter>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
