import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { ExternalLink } from "~/components/web/external-link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { companyManyPayload } from "~/server/web/companies/payloads"
import type { CompanyMany } from "~/server/web/companies/payloads"
import { findCertificationSlugs } from "~/server/web/certifications/queries"
import { db } from "~/services/db"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const certification = await db.certification.findFirst({
    where: { slug },
    include: {
      companies: {
        where: {
          company: { status: "published" },
        },
        include: {
          company: {
            select: companyManyPayload,
          },
        },
      },
    },
  })

  if (!certification) {
    notFound()
  }

  const companies = certification.companies
    .map(c => c.company)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/certifications/${certification.slug}`
  const title = `${certification.name} Certified Companies | Causeartist`
  const description =
    certification.description ??
    `Browse impact companies certified as ${certification.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/certifications", title: "Certifications" },
      { url, title: certification.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { certification, companies, ...data }
})

export const generateStaticParams = async () => {
  const certifications = await findCertificationSlugs({})
  return certifications.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

function CompanyCard({ company }: { company: CompanyMany }) {
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
        <CardDescription>{company.tagline ?? company.description}</CardDescription>
      </Link>
      <CardFooter>
        {company.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
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

export default async function CertificationDetailPage(props: Props) {
  const { certification, companies, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{certification.name}</H2>
        <IntroDescription className="max-w-3xl">
          {certification.description ??
            `Companies that have been associated with ${certification.name} in our directory.`}
        </IntroDescription>
        <p className="text-sm text-muted-foreground mt-2">
          {companies.length}{" "}
          {companies.length === 1 ? "certified company" : "certified companies"}
        </p>
        {certification.website && (
          <p className="mt-4">
            <ExternalLink
              href={certification.website}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              doFollow
            >
              Official certification website
            </ExternalLink>
          </p>
        )}
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
