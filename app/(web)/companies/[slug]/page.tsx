import { ArrowUpRightIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { H2, H5 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { ExternalLink } from "~/components/web/external-link"
import { FeaturedToolsIcons } from "~/components/web/listings/featured-tools-icons"
import { Markdown } from "~/components/web/markdown"
import { Nav } from "~/components/web/nav"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { IntroDescription } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { Sticky } from "~/components/web/ui/sticky"
import type { Thing } from "schema-dts"
import type { OpenGraphParams } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCompanySchema } from "~/lib/schema"
import { findCompany, findCompanySlugs } from "~/server/web/companies/queries"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const company = await findCompany({ where: { slug } })

  if (!company) {
    notFound()
  }

  const url = `/companies/${company.slug}`
  const title = `${company.name}: ${company.tagline ?? ""}`.replace(/: $/, "")
  const description = company.description ?? ""

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/companies", title: "Companies" },
      { url, title: company.name },
    ],
    structuredData: generateCompanySchema(company) as Thing[],
  })

  return { company, ...data }
})

export const generateStaticParams = async () => {
  const companies = await findCompanySlugs({})
  return companies.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { company, url, metadata } = await getData(props)

  const title = company.seoTitle ?? metadata.title
  const description = company.seoDescription ?? company.tagline ?? metadata.description

  const ogImage: OpenGraphParams = {
    title: company.name,
    description: String(description),
  }

  const robots =
    company.status !== "published" ? { index: false as const, follow: false as const } : undefined

  return getPageMetadata({
    url,
    metadata: { ...metadata, title, description, robots },
    ogImage,
  })
}

export default async function (props: Props) {
  const { company, metadata, breadcrumbs, structuredData } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Section>
        <Section.Content className="max-md:contents">
          <Sticky isOverlay>
            <Stack className="@container self-stretch">
              <Favicon src={company.logoUrl} title={company.name} className="size-8" />

              <Stack className="flex-1 min-w-0">
                <H2 as="h1" className="leading-tight! truncate">
                  {company.name}
                </H2>
              </Stack>

              <Backdrop />
            </Stack>
          </Sticky>

          {company.tagline && (
            <IntroDescription className="-mt-fluid-md pt-4">{company.tagline}</IntroDescription>
          )}

          {company.website && (
            <Stack className="w-full -mt-fluid-md pt-8">
              <Button variant="primary" suffix={<ArrowUpRightIcon />} className="md:min-w-36" asChild>
                <ExternalLink href={company.website} doFollow doTrack>
                  Visit {company.name}
                </ExternalLink>
              </Button>
            </Stack>
          )}

          {company.description && (
            <Markdown code={company.description} className="max-md:order-4" />
          )}

          {/* Sectors */}
          {!!company.sectors.length && (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 as="strong">Sectors:</H5>
              <Stack className="gap-2">
                {company.sectors.map(({ sector }) => (
                  <Badge key={sector.id} size="lg" asChild>
                    <Link href={`/companies/sector/${sector.slug}`}>{sector.name}</Link>
                  </Badge>
                ))}
              </Stack>
            </Stack>
          )}

          {company.certifications.length > 0 && (
            <div>
              <h3>Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {company.certifications.map(c => (
                  <Link
                    key={c.certification.slug}
                    href={`/certifications/${c.certification.slug}`}
                    className="text-sm px-3 py-1 rounded-full border border-green-500 text-green-700 hover:bg-green-50 transition-colors"
                  >
                    {c.certification.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {!!company.locations.length && (
            <Stack direction="column" className="w-full max-md:order-6">
              <H5 as="strong">Locations:</H5>
              <Stack className="gap-2">
                {company.locations.map(({ location }) => (
                  <Badge key={location.id} size="lg" variant="soft">
                    {location.name}
                  </Badge>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Metadata: foundedYear, totalFunding, founderName */}
          {(company.foundedYear != null || company.totalFunding || company.founderName) && (
            <Stack direction="column" className="w-full max-md:order-6 gap-1">
              {company.foundedYear != null && (
                <p className="text-sm text-muted-foreground">
                  <strong>Founded:</strong> {company.foundedYear}
                </p>
              )}
              {company.totalFunding && (
                <p className="text-sm text-muted-foreground">
                  <strong>Total funding:</strong> {company.totalFunding}
                </p>
              )}
              {company.founderName && (
                <p className="text-sm text-muted-foreground">
                  <strong>Founder:</strong> {company.founderName}
                </p>
              )}
            </Stack>
          )}

          {/* Impact model */}
          {company.impactModel && (
            <Stack direction="column" className="w-full max-md:order-7">
              <H5 as="strong">Impact model</H5>
              <Markdown code={company.impactModel} />
            </Stack>
          )}

          {/* Impact metrics */}
          {company.impactMetrics && (
            <Stack direction="column" className="w-full max-md:order-8">
              <H5 as="strong">Impact metrics</H5>
              <Markdown code={company.impactMetrics} />
            </Stack>
          )}

          <Stack className="w-full md:sticky md:bottom-2 md:z-10 max-md:order-9">
            <div className="absolute -inset-x-1 -bottom-3 -top-8 -z-1 pointer-events-none bg-background mask-t-from-66% max-md:hidden" />
            <Nav className="mr-auto" title={metadata.title} />
          </Stack>
        </Section.Content>

        <Section.Sidebar className="max-md:contents">
          <Suspense fallback={<AdCardSkeleton className="max-md:order-3" />}>
            <AdCard type="ToolPage" className="max-md:order-3" />
          </Suspense>
          <Suspense>
            <FeaturedToolsIcons className="max-md:order-8" />
          </Suspense>
        </Section.Sidebar>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
