import type { Metadata } from "next"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
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
  const title = company.tagline ?? company.description ?? ""

  return (
    <Card>
      <Link
        href={`/companies/${company.slug}`}
        className="flex flex-col gap-4 w-full min-w-0 text-left"
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <img
              src={company.logoUrl ?? undefined}
              alt={company.name}
              className="size-8 rounded object-contain"
            />
            <span className="font-semibold text-sm truncate">{company.name}</span>
          </div>
        </CardHeader>

        <CardDescription>{title}</CardDescription>
      </Link>

      <CardFooter>
        {company.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        {company.certifications
          .filter(c =>
            ["b-corp", "benefit-corporation"].includes(c.certification.slug),
          )
          .map(c => (
            <Link key={c.certification.slug} href={`/certifications/${c.certification.slug}`}>
              <Badge
                variant="outline"
                className="text-xs border-green-500 text-green-700"
              >
                {c.certification.name}
              </Badge>
            </Link>
          ))}
        {company.locations[0] && (
          <Link href={`/companies/location/${company.locations[0].location.slug}`}>
            <Badge variant="outline" className="text-xs inline-flex items-center gap-1.5 max-w-full min-w-0">
              <LocationCountryFlag countryCode={company.locations[0].location.countryCode} />
              <span className="truncate">{company.locations[0].location.name}</span>
            </Badge>
          </Link>
        )}
      </CardFooter>
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
        <Section.Content className="md:col-span-3">
          {companies.length === 0 ? (
            <p className="text-muted-foreground">No companies found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
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
