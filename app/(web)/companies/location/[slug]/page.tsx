import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { CompanyLogo } from "~/components/web/company-logo"
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

  const location = await db.location.findFirst({
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
    },
  })

  if (!location) {
    notFound()
  }

  const companies = location.companies
    .map(c => c.company)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/companies/location/${location.slug}`
  const title = `Impact Companies in ${location.name} | Causeartist`
  const description = `Discover mission-driven companies and social enterprises based in ${location.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url, title: location.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { location, companies, ...data }
})

export const generateStaticParams = async () => {
  const locations = await db.location.findMany({
    where: {
      companies: {
        some: {
          company: { status: "published" },
        },
      },
    },
    select: { slug: true },
  })
  return locations.map(({ slug }) => ({ slug }))
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
      </CardFooter>
    </Card>
  )
}

export default async function CompaniesByLocationPage(props: Props) {
  const { location, companies, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{location.name}</H2>
        <IntroDescription>
          {companies.length} Impact {companies.length === 1 ? "Company" : "Companies"}
        </IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {companies.length === 0 ? (
            <p className="text-muted-foreground">
              No companies found in this location yet.
            </p>
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
