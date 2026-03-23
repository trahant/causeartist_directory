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

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const subcategory = await db.subcategory.findFirst({
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

  if (!subcategory) {
    notFound()
  }

  const funders = subcategory.funders
    .map(f => f.funder)
    .sort((a, b) => a.name.localeCompare(b.name))

  if (funders.length === 0) {
    notFound()
  }

  const url = `/funders/focus/${subcategory.slug}`
  const title = `${subcategory.name} Investors & Funders | Causeartist`
  const description = `Find impact investors and funders focused on ${subcategory.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: subcategory.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { subcategory, funders, ...data }
})

export const generateStaticParams = async () => {
  const subcategories = await db.subcategory.findMany({
    where: {
      funders: {
        some: {
          funder: { status: "published" },
        },
      },
    },
    select: { slug: true },
  })
  return subcategories.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
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
          <div className="flex items-center gap-3">
            <img
              src={funder.logoUrl ?? undefined}
              alt={funder.name}
              className="size-8 rounded object-contain"
            />
            <span className="font-semibold text-sm truncate">{funder.name}</span>
          </div>
        </CardHeader>
        <CardDescription>{desc}</CardDescription>
      </Link>
      <CardFooter>
        {funder.sectors.slice(0, 3).map(s => (
          <Badge key={s.sector.slug}>{s.sector.name}</Badge>
        ))}
        <Badge className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
          {formatFunderType(funder.type)}
        </Badge>
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

export default async function FundersFocusPage(props: Props) {
  const { subcategory, funders, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{subcategory.name}</H2>
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
