import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardHeader } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
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

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const sector = await db.sector.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      heroText: true,
      funders: {
        where: { funder: { status: "published" } },
        select: { funder: { select: funderManyPayload } },
      },
    },
  })

  if (!sector) {
    notFound()
  }

  const funders = sector.funders
    .map(f => f.funder)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/funders/sector/${sector.slug}`
  const title = `${sector.name} Impact Funders`
  const description =
    sector.heroText ?? `Impact investors and funders in ${sector.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: sector.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { sector, funders, ...data }
})

export const generateStaticParams = async () => {
  const sectors = await db.sector.findMany({ select: { slug: true } })
  return sectors.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

function FunderCard({ funder }: { funder: FunderMany }) {
  return (
    <Card hover asChild>
      <Link href={`/funders/${funder.slug}`}>
        <CardHeader wrap={false}>
          <Stack className="gap-1.5" direction="row" wrap>
            <H2 as="h3" className="text-lg leading-snug!">
              {funder.name}
            </H2>
            {funder.type && (
              <Badge variant="outline" size="sm">
                {funder.type}
              </Badge>
            )}
          </Stack>
        </CardHeader>

        {funder.description && (
          <CardDescription className="line-clamp-3">{funder.description}</CardDescription>
        )}

        <Stack className="flex-wrap gap-1.5" direction="row" wrap>
          {funder.sectors.map(({ sector }) => (
            <Badge key={sector.id} variant="soft" size="sm">
              {sector.name}
            </Badge>
          ))}
        </Stack>
      </Link>
    </Card>
  )
}

export default async function (props: Props) {
  const { sector, funders, metadata, breadcrumbs, structuredData } =
    await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{sector.name}</H2>
        {sector.heroText && (
          <IntroDescription className="max-w-3xl">
            {sector.heroText}
          </IntroDescription>
        )}
      </Intro>

      <Section>
        <Section.Content>
          {funders.length === 0 ? (
            <p className="text-muted-foreground">No funders found.</p>
          ) : (
            <div className="grid w-full grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-3">
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
