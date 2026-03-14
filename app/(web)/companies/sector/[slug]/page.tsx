import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"
import { companyManyPayload } from "~/server/web/companies/payloads"
import type { CompanyMany } from "~/server/web/companies/payloads"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const sector = await db.sector.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      heroText: true,
      companies: {
        where: { company: { status: "published" } },
        select: { company: { select: companyManyPayload } },
      },
    },
  })

  if (!sector) {
    notFound()
  }

  const companies = sector.companies
    .map(c => c.company)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/companies/sector/${sector.slug}`
  const title = `${sector.name} Impact Companies`
  const description =
    sector.heroText ?? `Impact-driven companies in ${sector.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url, title: sector.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { sector, companies, ...data }
})

export const generateStaticParams = async () => {
  const sectors = await db.sector.findMany({ select: { slug: true } })
  return sectors.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
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

export default async function (props: Props) {
  const { sector, companies, metadata, breadcrumbs, structuredData } =
    await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{sector.name}</H2>
        {sector.heroText && (
          <IntroDescription className="max-w-3xl">
            {sector.heroText}
          </IntroDescription>
        )}
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
