import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"
import { funderManyPayload } from "~/server/web/funders/payloads"
import type { FunderMany } from "~/server/web/funders/payloads"

type Props = { params: Promise<{ slug: string }> }

function formatFunderType(type: string | null): string {
  switch (type) {
    case "vc":
      return "Venture Capital"
    case "foundation":
      return "Foundation"
    case "accelerator":
      return "Accelerator"
    case "family-office":
      return "Family Office"
    case "cdfi":
      return "CDFI"
    case "impact-fund":
      return "Impact Fund"
    case "fellowship":
      return "Fellowship"
    case "corporate":
      return "Corporate"
    default:
      return "Impact Fund"
  }
}

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const location = await db.location.findFirst({
    where: { slug },
    include: {
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

  if (!location) {
    notFound()
  }

  const funders = location.funders
    .map(f => f.funder)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/funders/location/${location.slug}`
  const title = `Impact Funders in ${location.name} | Causeartist`
  const description = `Discover impact investors, foundations, and accelerators based in ${location.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: location.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { location, funders, ...data }
})

export const generateStaticParams = async () => {
  const locations = await db.location.findMany({
    where: {
      funders: {
        some: {
          funder: { status: "published" },
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

function FunderCard({ funder }: { funder: FunderMany }) {
  const cardTitle = funder.description ?? ""

  return (
    <Card asChild>
      <Link href={`/funders/${funder.slug}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <img
              src={funder.logoUrl ?? undefined}
              alt={funder.name}
              className="size-8 rounded object-contain"
            />
            <span className="font-semibold text-sm truncate">{funder.name}</span>
            <Badge className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
              {formatFunderType(funder.type)}
            </Badge>
          </div>
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

export default async function FundersByLocationPage(props: Props) {
  const { location, funders, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{location.name}</H2>
        <IntroDescription>
          {funders.length} Impact {funders.length === 1 ? "Funder" : "Funders"}
        </IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {funders.length === 0 ? (
            <p className="text-muted-foreground">
              No funders found in this location yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {funders.map(funder => (
                <FunderCard key={funder.id} funder={funder} />
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
