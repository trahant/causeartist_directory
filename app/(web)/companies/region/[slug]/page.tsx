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

function regionDisplayName(slug: string): string {
  const map: Record<string, string> = {
    "north-america": "North America",
    europe: "Europe",
    "asia-pacific": "Asia Pacific",
    "latin-america": "Latin America",
    africa: "Africa",
    "middle-east": "Middle East",
  }
  return map[slug] ?? slug
}

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const companies = await db.company.findMany({
    where: {
      status: "published",
      locations: {
        some: {
          location: {
            region: slug,
          },
        },
      },
    },
    select: companyManyPayload,
    orderBy: { name: "asc" },
  })

  if (companies.length === 0) {
    notFound()
  }

  const regionLabel = regionDisplayName(slug)
  const url = `/companies/region/${slug}`
  const title = `Impact Companies in ${regionLabel} | Causeartist`
  const description = `Browse mission-driven companies across ${regionLabel}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url, title: regionLabel },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { slug, regionLabel, companies, ...data }
})

export const generateStaticParams = async () => {
  const locations = await db.location.findMany({
    where: {
      region: { not: null },
      companies: {
        some: {
          company: { status: "published" },
        },
      },
    },
    select: { region: true },
  })
  const slugs = [
    ...new Set(
      locations
        .map(l => l.region)
        .filter((r): r is string => r != null && r.length > 0),
    ),
  ]
  return slugs.map(slug => ({ slug }))
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

export default async function CompaniesByRegionPage(props: Props) {
  const { regionLabel, companies, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{regionLabel}</H2>
        <IntroDescription>
          {companies.length} Impact {companies.length === 1 ? "Company" : "Companies"}
        </IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {companies.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
