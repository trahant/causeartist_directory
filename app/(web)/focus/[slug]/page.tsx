import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2, H5 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { CompanyLogo } from "~/components/web/company-logo"
import { FunderCardHeader } from "~/components/web/funders/funder-card-header"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { formatFunderType } from "~/lib/format-funder-type"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"
import { companyManyPayload } from "~/server/web/companies/payloads"
import type { CompanyMany } from "~/server/web/companies/payloads"
import { funderManyPayload } from "~/server/web/funders/payloads"
import type { FunderMany } from "~/server/web/funders/payloads"

const PREVIEW_LIMIT = 6

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const subcategory = await db.subcategory.findFirst({
    where: { slug },
    include: {
      companies: {
        where: { company: { status: "published" } },
        include: {
          company: {
            select: companyManyPayload,
          },
        },
      },
      funders: {
        where: { funder: { status: "published" } },
        include: {
          funder: {
            select: funderManyPayload,
          },
        },
      },
    },
  })

  if (!subcategory) {
    notFound()
  }

  const companies = subcategory.companies
    .map(c => c.company)
    .sort((a, b) => a.name.localeCompare(b.name))

  const funders = subcategory.funders
    .map(f => f.funder)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/focus/${subcategory.slug}`
  const title = `${subcategory.name} | Impact Companies & Investors | Causeartist`
  const description = `Explore impact companies and investors focused on ${subcategory.name}. Find startups, funders, and accelerators in this space.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/", title: "Home" },
      { url, title: subcategory.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { subcategory, companies, funders, ...data }
})

export const generateStaticParams = async () => {
  const subcategories = await db.subcategory.findMany({
    where: {
      OR: [
        { companies: { some: { company: { status: "published" } } } },
        { funders: { some: { funder: { status: "published" } } } },
      ],
    },
    select: { slug: true },
  })
  return subcategories.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

function CompanyCard({ company }: { company: CompanyMany }) {
  const cardTitle = company.tagline ?? company.description ?? ""

  return (
    <Card>
      <Link
        href={`/companies/${company.slug}`}
        className="flex flex-col gap-4 w-full min-w-0 text-left"
      >
        <CardHeader>
          <div className="flex min-w-0 w-full gap-3">
            <CompanyLogo
              logoUrl={company.logoUrl}
              name={company.name}
              className="size-8 rounded object-contain"
            />
            <div className="min-w-0 flex-1">
              <span className="text-pretty text-sm font-semibold wrap-break-word">{company.name}</span>
            </div>
          </div>
        </CardHeader>
        <CardDescription>{cardTitle}</CardDescription>
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

function FunderCard({ funder }: { funder: FunderMany }) {
  const desc = funder.description ?? ""

  return (
    <Card>
      <Link
        href={`/funders/${funder.slug}`}
        className="flex flex-col gap-4 w-full min-w-0 text-left"
      >
        <CardHeader>
          <FunderCardHeader
            logoUrl={funder.logoUrl}
            name={funder.name}
            typeLabel={formatFunderType(funder.type)}
          />
        </CardHeader>
        <CardDescription>{desc}</CardDescription>
      </Link>
      <CardFooter>
        {funder.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        {funder.locations[0] && (
          <Link href={`/funders/location/${funder.locations[0].location.slug}`}>
            <Badge variant="outline" className="text-xs inline-flex items-center gap-1.5 max-w-full min-w-0">
              <LocationCountryFlag countryCode={funder.locations[0].location.countryCode} />
              <span className="truncate">{funder.locations[0].location.name}</span>
            </Badge>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

export default async function FocusHubPage(props: Props) {
  const { subcategory, companies, funders, breadcrumbs, structuredData } =
    await getData(props)

  const companyCount = companies.length
  const funderCount = funders.length
  const previewCompanies = companies.slice(0, PREVIEW_LIMIT)
  const previewFunders = funders.slice(0, PREVIEW_LIMIT)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{subcategory.name}</H2>
        <IntroDescription className="max-w-3xl">
          Explore impact companies and investors focused on {subcategory.name}. Find startups,
          funders, and accelerators in this space.
        </IntroDescription>
      </Intro>

      <div className="space-y-12">
        {companyCount > 0 ? (
          <Section>
            <Section.Content className="md:col-span-3 space-y-4">
              <H5 as="h2">
                Companies ({companyCount}{" "}
                {companyCount === 1 ? "company" : "companies"})
              </H5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {previewCompanies.map(company => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
              {companyCount > PREVIEW_LIMIT ? (
                <p>
                  <Link
                    href={`/companies/focus/${subcategory.slug}`}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View all {companyCount} companies
                  </Link>
                </p>
              ) : null}
            </Section.Content>
          </Section>
        ) : null}

        {funderCount > 0 ? (
          <Section>
            <Section.Content className="md:col-span-3 space-y-4">
              <H5 as="h2">
                Funders &amp; Investors ({funderCount}{" "}
                {funderCount === 1 ? "funder" : "funders"})
              </H5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {previewFunders.map(funder => (
                  <FunderCard key={funder.id} funder={funder} />
                ))}
              </div>
              {funderCount > PREVIEW_LIMIT ? (
                <p>
                  <Link
                    href={`/funders/focus/${subcategory.slug}`}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View all {funderCount} funders
                  </Link>
                </p>
              ) : null}
            </Section.Content>
          </Section>
        ) : null}
      </div>

      <StructuredData data={structuredData} />
    </>
  )
}
