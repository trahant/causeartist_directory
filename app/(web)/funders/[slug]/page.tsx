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
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { Section } from "~/components/web/ui/section"
import { Sticky } from "~/components/web/ui/sticky"
import type { Thing } from "schema-dts"
import type { OpenGraphParams } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateFunderSchema } from "~/lib/schema"
import { findFunder, findFunderSlugs } from "~/server/web/funders/queries"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const funder = await findFunder({ where: { slug } })

  if (!funder) {
    notFound()
  }

  const url = `/funders/${funder.slug}`
  const title = `${funder.name}: ${funder.type ?? ""}`.replace(/: $/, "")
  const description = funder.description ?? ""

  const data = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/funders", title: "Funders" },
      { url, title: funder.name },
    ],
    structuredData: generateFunderSchema(funder) as Thing[],
  })

  return { funder, ...data }
})

export const generateStaticParams = async () => {
  const funders = await findFunderSlugs({})
  return funders.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { funder, url, metadata } = await getData(props)

  const title = funder.seoTitle ?? metadata.title
  const description = funder.seoDescription ?? funder.description ?? metadata.description

  const ogImage: OpenGraphParams = {
    title: funder.name,
    description: String(description),
  }

  const robots =
    funder.status !== "published" ? { index: false as const, follow: false as const } : undefined

  return getPageMetadata({
    url,
    metadata: { ...metadata, title, description, robots },
    ogImage,
  })
}

function formatCheckSize(min: number | null, max: number | null): string {
  if (min != null && max != null) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`
  }
  if (min != null) return `From $${min.toLocaleString()}`
  if (max != null) return `Up to $${max.toLocaleString()}`
  return "Varies"
}

export default async function (props: Props) {
  const { funder, metadata, structuredData } = await getData(props)

  const checkSizeText =
    funder.checkSizeMin != null || funder.checkSizeMax != null
      ? formatCheckSize(funder.checkSizeMin, funder.checkSizeMax)
      : null

  return (
    <>
      <Section>
        <Section.Content className="max-md:contents">
          <Sticky isOverlay>
            <Stack className="@container self-stretch">
              <Favicon src={funder.logoUrl} title={funder.name} className="size-8" />

              <Stack className="flex-1 min-w-0">
                <Stack className="gap-2" direction="row" wrap>
                  <H2 as="h1" className="leading-tight! truncate">
                    {funder.name}
                  </H2>
                  {funder.type && (
                    <Badge variant="outline" size="lg">
                      {funder.type}
                    </Badge>
                  )}
                </Stack>
              </Stack>

              <Backdrop />
            </Stack>
          </Sticky>

          {funder.website && (
            <Stack className="w-full -mt-fluid-md pt-8">
              <Button variant="primary" suffix={<ArrowUpRightIcon />} className="md:min-w-36" asChild>
                <ExternalLink href={funder.website} doFollow doTrack>
                  Visit {funder.name}
                </ExternalLink>
              </Button>
            </Stack>
          )}

          {funder.description && (
            <Markdown code={funder.description} className="-mt-fluid-md pt-4 max-md:order-4" />
          )}

          {/* Investment thesis */}
          {funder.investmentThesis && (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 as="strong">Investment thesis</H5>
              <Markdown code={funder.investmentThesis} />
            </Stack>
          )}

          {/* Check size */}
          {checkSizeText && (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 as="strong">Check size</H5>
              <p className="text-muted-foreground">{checkSizeText}</p>
            </Stack>
          )}

          {/* Application CTA */}
          {funder.applicationUrl && (
            <Stack className="w-full -mt-fluid-md pt-4 max-md:order-5">
              <Button variant="primary" suffix={<ArrowUpRightIcon />} className="md:min-w-36" asChild>
                <ExternalLink href={funder.applicationUrl} doFollow doTrack>
                  Apply
                </ExternalLink>
              </Button>
            </Stack>
          )}

          {/* Sectors */}
          {!!funder.sectors.length && (
            <Stack direction="column" className="w-full max-md:order-6">
              <H5 as="strong">Sectors:</H5>
              <Stack className="gap-2">
                {funder.sectors.map(({ sector }) => (
                  <Badge key={sector.id} size="lg" asChild>
                    <Link href={`/funders/sector/${sector.slug}`}>{sector.name}</Link>
                  </Badge>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Locations */}
          {!!funder.locations.length && (
            <Stack direction="column" className="w-full max-md:order-7">
              <H5 as="strong">Locations:</H5>
              <Stack className="gap-2">
                {funder.locations.map(({ location }) => (
                  <Badge key={location.id} size="lg" variant="soft">
                    {location.name}
                  </Badge>
                ))}
              </Stack>
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
