import type { Metadata } from "next"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findFunders } from "~/server/web/funders/queries"
import type { FunderMany } from "~/server/web/funders/payloads"

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

function FunderCard({ funder }: { funder: FunderMany }) {
  return (
    <Card hover asChild>
      <Link href={`/funders/${funder.slug}`}>
        <CardHeader wrap={false}>
          <Stack className="gap-1.5" direction="row" wrap>
            <H2 as="h3" className="text-lg leading-snug!">
              {funder.name}
            </H2>
            {funder.type && (
              <Badge variant="outline" size="sm">
                {funder.type}
              </Badge>
            )}
          </Stack>
        </CardHeader>

        {funder.description && (
          <CardDescription className="line-clamp-3">{funder.description}</CardDescription>
        )}

        <Stack className="flex-wrap gap-1.5" direction="row" wrap>
          {funder.sectors.map(({ sector }) => (
            <Badge key={sector.id} variant="soft" size="sm">
              {sector.name}
            </Badge>
          ))}
        </Stack>
      </Link>
    </Card>
  )
}

export default async function FundersPage() {
  const funders = await findFunders({})
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content>
          {funders.length === 0 ? (
            <p className="text-muted-foreground">No funders found.</p>
          ) : (
            <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-3">
              {funders.map(funder => (
                <FunderCard key={funder.id} funder={funder} />
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
