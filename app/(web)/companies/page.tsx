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
import { findCompanies } from "~/server/web/companies/queries"
import type { CompanyMany } from "~/server/web/companies/payloads"

const url = "/companies"
const title = "Impact Companies Directory"
const description =
  "Browse impact-driven companies across clean energy, sustainable food, climate tech, and more."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Companies" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

function CompanyCard({ company }: { company: CompanyMany }) {
  const locationName = company.locations[0]?.location?.name

  return (
    <Card hover asChild>
      <Link href={`/companies/${company.slug}`}>
        <CardHeader wrap={false}>
          <H2 as="h3" className="text-lg leading-snug!">
            {company.name}
          </H2>
        </CardHeader>

        {company.tagline && <CardDescription>{company.tagline}</CardDescription>}

        <Stack className="flex-wrap gap-1.5" direction="row" wrap>
          {company.sectors.map(({ sector }) => (
            <Badge key={sector.id} variant="soft" size="sm">
              {sector.name}
            </Badge>
          ))}
        </Stack>

        {locationName && (
          <p className="text-sm text-muted-foreground">{locationName}</p>
        )}
      </Link>
    </Card>
  )
}

export default async function CompaniesPage() {
  const companies = await findCompanies({})
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content>
          {companies.length === 0 ? (
            <p className="text-muted-foreground">No companies found.</p>
          ) : (
            <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-3">
              {companies.map(company => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
