import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription } from "~/components/common/card"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { Favicon } from "~/components/web/ui/favicon"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"
import { companyManyPayload } from "~/server/web/companies/payloads"
import type { CompanyMany } from "~/server/web/companies/payloads"

function getInitials(name: string) {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, "")
  const parts = cleaned.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? ""
  return `${first}${second}`.toUpperCase() || "??"
}

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
      companies: {
        where: { company: { status: "published" } },
        select: { company: { select: companyManyPayload } },
      },
    },
  })

  if (!sector) {
    notFound()
  }

  const companies = sector.companies
    .map(c => c.company)
    .sort((a, b) => a.name.localeCompare(b.name))

  const url = `/companies/sector/${sector.slug}`
  const title = `${sector.name} Impact Companies`
  const description =
    sector.heroText ?? `Impact-driven companies in ${sector.name}.`

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url, title: sector.name },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })

  return { sector, companies, ...data }
})

export const generateStaticParams = async () => {
  const sectors = await db.sector.findMany({ select: { slug: true } })
  return sectors.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { url, metadata } = await getData(props)
  return getPageMetadata({ url, metadata })
}

function CompanyCard({ company }: { company: CompanyMany }) {
  const subtitle = company.tagline ?? company.description ?? null
  const displayedSectors = company.sectors.slice(0, 4)
  const remaining = company.sectors.length - displayedSectors.length

  return (
    <Card hover asChild className="h-full">
      <Link href={`/companies/${company.slug}`}>
        <Stack direction="column" className="h-full justify-between gap-4">
          <Stack direction="row" wrap={false} className="items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              {company.logoUrl ? (
                <Favicon
                  src={company.logoUrl}
                  title={company.name}
                  size={32}
                  className="!size-8 !rounded-sm"
                />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">{getInitials(company.name)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <H2 as="h3" className="text-base leading-snug!">
                {company.name}
              </H2>
              {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
            </div>
          </Stack>

          <Stack direction="row" wrap className="flex-wrap gap-2 pt-2">
            {displayedSectors.map(({ sector }) => (
              <Badge key={sector.id} variant="soft" size="md">
                {sector.name}
              </Badge>
            ))}
            {remaining > 0 && <Badge variant="soft" size="md">{`+${remaining}`}</Badge>}
          </Stack>
        </Stack>
      </Link>
    </Card>
  )
}

export default async function (props: Props) {
  const { sector, companies, metadata, breadcrumbs, structuredData } =
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
        <Section.Content className="md:col-span-3">
          {companies.length === 0 ? (
            <p className="text-muted-foreground">No companies found.</p>
          ) : (
            <div className="grid w-full items-stretch grid-cols-1 place-content-start gap-5 md:grid-cols-2 lg:grid-cols-3">
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
