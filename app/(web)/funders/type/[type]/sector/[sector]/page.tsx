import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
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
import { isRetiredSectorSlug } from "~/server/web/sectors/retired"
import { funderManyPayload } from "~/server/web/funders/payloads"
import type { FunderMany } from "~/server/web/funders/payloads"

const typeDisplay: Record<string, string> = {
  vc: "Venture Capital",
  foundation: "Foundation",
  accelerator: "Accelerator",
  "family-office": "Family Office",
  cdfi: "CDFI",
  "impact-fund": "Impact Fund",
  fellowship: "Fellowship",
  corporate: "Corporate",
}

type Props = { params: Promise<{ type: string; sector: string }> }

const getData = cache(async ({ params }: Props) => {
  const { type: typeSlug, sector: sectorSlug } = await params

  const sector = await db.sector.findUnique({
    where: { slug: sectorSlug },
    select: { id: true, name: true, slug: true },
  })

  if (!sector) {
    notFound()
  }

  const funders = await db.funder.findMany({
    where: {
      status: "published",
      type: typeSlug,
      sectors: { some: { sector: { slug: sectorSlug } } },
    },
    select: funderManyPayload,
    orderBy: { name: "asc" },
  })

  if (funders.length === 0) {
    notFound()
  }

  const typeName = typeDisplay[typeSlug] ?? formatFunderType(typeSlug)
  const url = `/funders/type/${typeSlug}/sector/${sector.slug}`
  const title = `${typeName} Investors in ${sector.name} | Causeartist`
  const description = `Find ${typeName} investors focused on ${sector.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url: `/funders/type/${typeSlug}`, title: typeName },
      { url, title: sector.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { sector, typeSlug, typeName, funders, ...data }
})

export const generateStaticParams = async () => {
  const funders = await db.funder.findMany({
    where: {
      status: "published",
      type: { not: null },
    },
    select: {
      type: true,
      sectors: { select: { sector: { select: { slug: true } } } },
    },
  })

  const seen = new Set<string>()
  const out: { type: string; sector: string }[] = []

  for (const f of funders) {
    if (!f.type) continue
    for (const s of f.sectors) {
      if (isRetiredSectorSlug(s.sector.slug)) continue
      const key = `${f.type}:${s.sector.slug}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ type: f.type, sector: s.sector.slug })
    }
  }

  return out
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

function FunderCard({ funder }: { funder: FunderMany }) {
  const title = funder.description ?? ""

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
            typeLabel={funder.type ? formatFunderType(funder.type) : ""}
          />
        </CardHeader>

        <CardDescription>{title}</CardDescription>
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

export default async function FundersByTypeAndSectorPage(props: Props) {
  const { sector, typeName, funders, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">
          {typeName} Investors in {sector.name}
        </H2>
        <IntroDescription>
          {funders.length} {funders.length === 1 ? "Funder" : "Funders"}
        </IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {funders.map(funder => (
              <FunderCard key={funder.id} funder={funder} />
            ))}
          </div>
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
