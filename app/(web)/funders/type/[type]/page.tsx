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
import { formatFunderType } from "~/lib/format-funder-type"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"
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

type Props = { params: Promise<{ type: string }> }

const getData = cache(async ({ params }: Props) => {
  const { type: typeSlug } = await params

  const funders = await db.funder.findMany({
    where: {
      status: "published",
      type: typeSlug,
    },
    select: funderManyPayload,
    orderBy: { name: "asc" },
  })

  if (funders.length === 0) {
    notFound()
  }

  const typeName = typeDisplay[typeSlug] ?? formatFunderType(typeSlug)
  const url = `/funders/type/${typeSlug}`
  const title = `${typeName} Impact Funders | Causeartist`
  const description = `Discover ${typeName} investors and funders in the impact economy.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: typeName },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { typeSlug, typeName, funders, ...data }
})

export const generateStaticParams = async () => {
  const grouped = await db.funder.groupBy({
    by: ["type"],
    where: {
      status: "published",
      type: { not: null },
    },
  })

  return grouped
    .filter((g): g is { type: string } => g.type != null && g.type !== "")
    .map(({ type }) => ({ type }))
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
          <div className="flex items-center gap-3">
            <img
              src={funder.logoUrl ?? undefined}
              alt={funder.name}
              className="size-8 rounded object-contain"
            />
            <span className="font-semibold text-sm truncate">{funder.name}</span>
          </div>
        </CardHeader>

        <CardDescription>{title}</CardDescription>
      </Link>

      <CardFooter>
        {funder.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        {funder.type && (
          <Badge className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
            {formatFunderType(funder.type)}
          </Badge>
        )}
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

export default async function FundersByTypePage(props: Props) {
  const { typeName, funders, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{typeName} Funders</H2>
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
