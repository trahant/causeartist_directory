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

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params

  const stage = await db.fundingStage.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      funders: {
        where: { funder: { status: "published" } },
        select: { funder: { select: funderManyPayload } },
      },
    },
  })

  if (!stage) {
    notFound()
  }

  const funders = stage.funders.map(f => f.funder).sort((a, b) => a.name.localeCompare(b.name))

  if (funders.length === 0) {
    notFound()
  }

  const url = `/funders/stage/${stage.slug}`
  const title = `${stage.name} Impact Funders`
  const description = `Impact investors and funders investing at ${stage.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: stage.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { stage, funders, ...data }
})

export const generateStaticParams = async () => {
  const stages = await db.fundingStage.findMany({
    where: {
      funders: {
        some: { funder: { status: "published" } },
      },
    },
    select: { slug: true },
  })
  return stages.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

function FunderCard({ funder }: { funder: FunderMany }) {
  return (
    <Card asChild>
      <Link href={`/funders/${funder.slug}`}>
        <CardHeader>
          <div className="flex min-w-0 w-full gap-3">
            <img
              src={funder.logoUrl ?? undefined}
              alt={funder.name}
              className="size-8 shrink-0 rounded object-contain"
            />
            <div className="min-w-0 flex-1">
              <span className="text-pretty text-sm font-semibold wrap-break-word">{funder.name}</span>
            </div>
          </div>
        </CardHeader>
        <CardDescription>{funder.description}</CardDescription>
        <CardFooter>
          {funder.sectors.slice(0, 3).map(s => (
            <Badge key={s.sector.slug}>{s.sector.name}</Badge>
          ))}
        </CardFooter>
      </Link>
    </Card>
  )
}

export default async function (props: Props) {
  const { stage, funders, metadata, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <H2 as="h1">{stage.name}</H2>
        <IntroDescription className="max-w-3xl">{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
