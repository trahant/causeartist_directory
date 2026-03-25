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

type Props = { params: Promise<{ slug: string; cert: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug: sectorSlug, cert: certSlug } = await params

  if (isRetiredSectorSlug(sectorSlug)) {
    notFound()
  }

  const [sector, certification] = await Promise.all([
    db.sector.findUnique({
      where: { slug: sectorSlug },
      select: { id: true, name: true, slug: true },
    }),
    db.certification.findUnique({
      where: { slug: certSlug },
      select: { id: true, name: true, slug: true },
    }),
  ])

  if (!sector || !certification) {
    notFound()
  }

  const companies = await db.company.findMany({
    where: {
      status: "published",
      sectors: { some: { sector: { slug: sectorSlug } } },
      certifications: { some: { certification: { slug: certSlug } } },
    },
    select: companyManyPayload,
    orderBy: { name: "asc" },
  })

  if (companies.length === 0) {
    notFound()
  }

  const url = `/companies/sector/${sector.slug}/certification/${certification.slug}`
  const title = `${certification.name} Certified ${sector.name} Companies | Causeartist`
  const description = `Discover ${certification.name} certified companies in the ${sector.name} space.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url: `/companies/sector/${sector.slug}`, title: sector.name },
      { url, title: certification.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { sector, certification, companies, ...data }
})

export const generateStaticParams = async () => {
  const published = await db.company.findMany({
    where: { status: "published" },
    select: {
      sectors: { select: { sector: { select: { slug: true } } } },
      certifications: { select: { certification: { select: { slug: true } } } },
    },
  })

  const seen = new Set<string>()
  const out: { slug: string; cert: string }[] = []

  for (const c of published) {
    for (const s of c.sectors) {
      if (isRetiredSectorSlug(s.sector.slug)) continue
      for (const cert of c.certifications) {
        const key = `${s.sector.slug}:${cert.certification.slug}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ slug: s.sector.slug, cert: cert.certification.slug })
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
          <div className="flex min-w-0 w-full gap-3">
            <img
              src={company.logoUrl ?? undefined}
              alt={company.name}
              className="size-8 shrink-0 rounded object-contain"
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
          .filter(ce =>
            ["b-corp", "benefit-corporation"].includes(ce.certification.slug),
          )
          .map(ce => (
            <Link key={ce.certification.slug} href={`/certifications/${ce.certification.slug}`}>
              <Badge
                variant="outline"
                className="text-xs border-green-500 text-green-700"
              >
                {ce.certification.name}
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

export default async function CompaniesBySectorAndCertificationPage(props: Props) {
  const { sector, certification, companies, breadcrumbs, structuredData } =
    await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">
          {certification.name} {sector.name} Companies
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
