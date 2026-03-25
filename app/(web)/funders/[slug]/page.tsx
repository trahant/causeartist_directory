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
import { ProfileContent } from "~/components/web/profiles/profile-content"
import { Nav } from "~/components/web/nav"
import {
  FunderHeroBand,
  FunderKeyBenefitsSection,
  FunderPodcastSection,
  FunderPortfolioSection,
  FunderProfileLocationsSection,
  FunderSecondaryCtas,
  FunderTaxonomyBand,
} from "~/components/web/profiles/funder-profile-sections"
import { FunderProfileStatsCard } from "~/components/web/profiles/funder-profile-stats"
import { RelatedFunders, RelatedFundersSkeleton } from "~/components/web/listings/related-funders"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
import { Section } from "~/components/web/ui/section"
import { Sticky } from "~/components/web/ui/sticky"
import type { Thing } from "schema-dts"
import { formatFunderCheckSize } from "~/lib/format-funder-check-size"
import { formatFunderType, isFunderTypeSlug } from "~/lib/format-funder-type"
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

export default async function (props: Props) {
  const { funder, metadata, breadcrumbs, structuredData } = await getData(props)

  const checkSizeText = formatFunderCheckSize(funder.checkSizeMin, funder.checkSizeMax)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Section>
        <Section.Content className="max-md:contents">
          <Sticky isOverlay>
            <Stack className="@container min-w-0 flex-1 self-stretch">
              <Favicon src={funder.logoUrl} title={funder.name} className="size-8" />

              <Stack className="min-w-0 flex-1">
                <Stack className="min-w-0 gap-2" direction="row" wrap={false}>
                  <H2 as="h1" className="min-w-0 flex-1 leading-tight! truncate">
                    {funder.name}
                  </H2>
                  {isFunderTypeSlug(funder.type) ? (
                    <Badge variant="outline" size="lg" className="shrink-0" asChild>
                      <Link href={`/funders/type/${funder.type}`}>{formatFunderType(funder.type)}</Link>
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="lg" className="shrink-0">
                      {formatFunderType(funder.type)}
                    </Badge>
                  )}
                </Stack>
              </Stack>

              <Backdrop />
            </Stack>
          </Sticky>

          {funder.website ? (
            <Stack className="w-full -mt-fluid-md pt-6 max-md:order-3">
              <Button variant="primary" suffix={<ArrowUpRightIcon />} className="md:min-w-36" asChild>
                <ExternalLink href={funder.website} doFollow doTrack>
                  Visit {funder.name}
                </ExternalLink>
              </Button>
            </Stack>
          ) : null}

          <FunderHeroBand funder={funder} />

          <FunderSecondaryCtas funder={funder} />
          <FunderProfileLocationsSection funder={funder} />

          <ProfileContent
            content={funder.description}
            className="-mt-fluid-md pt-4 max-md:order-4"
          />

          <FunderKeyBenefitsSection funder={funder} />

          {funder.investmentThesis ? (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 as="strong">Investment thesis</H5>
              <ProfileContent content={funder.investmentThesis} />
            </Stack>
          ) : null}

          {checkSizeText ? (
            <Stack direction="column" className="w-full max-md:order-5">
              <H5 as="strong">Check size</H5>
              <p className="text-muted-foreground">{checkSizeText}</p>
            </Stack>
          ) : null}

          <FunderPortfolioSection funder={funder} />
          <FunderPodcastSection funder={funder} />

          <FunderTaxonomyBand funder={funder} />

          <Stack className="w-full max-md:order-9 md:sticky md:bottom-2 md:z-10">
            <div className="pointer-events-none absolute -inset-x-1 -bottom-3 -top-8 -z-1 bg-background mask-t-from-66% max-md:hidden" />
            <Nav className="mr-auto" title={metadata.title} />
          </Stack>
        </Section.Content>

        <Section.Sidebar className="max-md:contents">
          <Stack className="max-md:order-3 gap-4">
            <FunderProfileStatsCard funder={funder} />
            <Suspense fallback={<AdCardSkeleton />}>
              <AdCard type="ToolPage" />
            </Suspense>
          </Stack>
        </Section.Sidebar>
      </Section>

      <Suspense fallback={<RelatedFundersSkeleton funder={funder} className="mt-10" />}>
        <RelatedFunders funder={funder} className="mt-10" />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
