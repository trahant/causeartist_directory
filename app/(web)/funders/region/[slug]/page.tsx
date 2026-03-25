import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { FunderCardHeader } from "~/components/web/funders/funder-card-header"
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

  const funders = await db.funder.findMany({
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
    select: funderManyPayload,
    orderBy: { name: "asc" },
  })

  if (funders.length === 0) {
    notFound()
  }

  const regionLabel = regionDisplayName(slug)
  const url = `/funders/region/${slug}`
  const title = `Impact Funders in ${regionLabel} | Causeartist`
  const description = `Browse impact investors, foundations, and accelerators across ${regionLabel}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: regionLabel },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { slug, regionLabel, funders, ...data }
})

export const generateStaticParams = async () => {
  const locations = await db.location.findMany({
    where: {
      region: { not: null },
      funders: {
        some: {
          funder: { status: "published" },
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

function FunderCard({ funder }: { funder: FunderMany }) {
  const cardTitle = funder.description ?? ""

  return (
    <Card asChild>
      <Link href={`/funders/${funder.slug}`}>
        <CardHeader>
          <FunderCardHeader
            logoUrl={funder.logoUrl}
            name={funder.name}
            typeLabel={formatFunderType(funder.type)}
          />
        </CardHeader>

        <CardDescription>{cardTitle}</CardDescription>

        <CardFooter>
          {funder.sectors.slice(0, 3).map(s => (
            <Badge key={s.sector.slug}>{s.sector.name}</Badge>
          ))}
        </CardFooter>
      </Link>
    </Card>
  )
}

export default async function FundersByRegionPage(props: Props) {
  const { regionLabel, funders, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{regionLabel}</H2>
        <IntroDescription>
          {funders.length} Impact {funders.length === 1 ? "Funder" : "Funders"}
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
