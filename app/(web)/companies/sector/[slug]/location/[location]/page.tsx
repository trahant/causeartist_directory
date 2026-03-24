import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"
import { isRetiredSectorSlug } from "~/server/web/sectors/retired"
import { companyManyPayload } from "~/server/web/companies/payloads"
import type { CompanyMany } from "~/server/web/companies/payloads"

type Props = { params: Promise<{ slug: string; location: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug: sectorSlug, location: locationSlug } = await params

  if (isRetiredSectorSlug(sectorSlug)) {
    notFound()
  }

  const [sector, location] = await Promise.all([
    db.sector.findUnique({
      where: { slug: sectorSlug },
      select: { id: true, name: true, slug: true },
    }),
    db.location.findUnique({
      where: { slug: locationSlug },
      select: { id: true, name: true, slug: true },
    }),
  ])

  if (!sector || !location) {
    notFound()
  }

  const companies = await db.company.findMany({
    where: {
      status: "published",
      sectors: { some: { sector: { slug: sectorSlug } } },
      locations: { some: { location: { slug: locationSlug } } },
    },
    select: companyManyPayload,
    orderBy: { name: "asc" },
  })

  if (companies.length === 0) {
    notFound()
  }

  const url = `/companies/sector/${sector.slug}/location/${location.slug}`
  const title = `${sector.name} Companies in ${location.name} | Causeartist`
  const description = `Browse ${sector.name} companies based in ${location.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url: `/companies/sector/${sector.slug}`, title: sector.name },
      { url, title: location.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { sector, location, companies, ...data }
})

export const generateStaticParams = async () => {
  const published = await db.company.findMany({
    where: { status: "published" },
    select: {
      sectors: { select: { sector: { select: { slug: true } } } },
      locations: { select: { location: { select: { slug: true } } } },
    },
  })

  const seen = new Set<string>()
  const out: { slug: string; location: string }[] = []

  for (const c of published) {
    for (const s of c.sectors) {
      if (isRetiredSectorSlug(s.sector.slug)) continue
      for (const loc of c.locations) {
        const key = `${s.sector.slug}:${loc.location.slug}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ slug: s.sector.slug, location: loc.location.slug })
      }
    }
  }

  return out
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
          <div className="flex items-center gap-3">
            <img
              src={company.logoUrl ?? undefined}
              alt={company.name}
              className="size-8 rounded object-contain"
            />
            <span className="font-semibold text-sm truncate">{company.name}</span>
          </div>
        </CardHeader>

        <CardDescription>{cardTitle}</CardDescription>
      </Link>

      <CardFooter>
        {company.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        {company.certifications
          .filter(cert =>
            ["b-corp", "benefit-corporation"].includes(cert.certification.slug),
          )
          .map(cert => (
            <Link key={cert.certification.slug} href={`/certifications/${cert.certification.slug}`}>
              <Badge
                variant="outline"
                className="text-xs border-green-500 text-green-700"
              >
                {cert.certification.name}
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

export default async function CompaniesBySectorAndLocationPage(props: Props) {
  const { sector, location, companies, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">
          {sector.name} Companies in {location.name}
        </H2>
        <IntroDescription>
          {companies.length} {companies.length === 1 ? "Company" : "Companies"}
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
