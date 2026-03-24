import { ArrowUpRightIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"
import { Button } from "~/components/common/button"
import { H2, H5 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { AdCard, AdCardSkeleton } from "~/components/web/ads/ad-card"
import { ExternalLink } from "~/components/web/external-link"
import { ProfileContent } from "~/components/web/profiles/profile-content"
import { Nav } from "~/components/web/nav"
import {
  CompanyCaseStudiesSection,
  CompanyFounderMetadata,
  CompanyHeroBand,
  CompanyInvestorsSection,
  CompanyKeyBenefitsSection,
  CompanyPodcastSection,
  CompanyProfileLocationsSection,
  CompanySecondaryCtas,
  CompanySocialRow,
  CompanyTaxonomyBand,
} from "~/components/web/profiles/company-profile-sections"
import { CompanyProfileStatsCard } from "~/components/web/profiles/company-profile-stats"
import { RelatedCompanies, RelatedCompaniesSkeleton } from "~/components/web/listings/related-companies"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Favicon } from "~/components/web/ui/favicon"
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

              <Stack className="min-w-0 flex-1">
                <H2 as="h1" className="leading-tight! truncate">
                  {company.name}
                </H2>
              </Stack>

              <Backdrop />
            </Stack>
          </Sticky>

          <CompanyHeroBand company={company} />
          <CompanySocialRow company={company} />

          {company.website ? (
            <Stack className="w-full -mt-fluid-md pt-6 max-md:order-3">
              <Button variant="primary" suffix={<ArrowUpRightIcon />} className="md:min-w-36" asChild>
                <ExternalLink href={company.website} doFollow doTrack>
                  Visit {company.name}
                </ExternalLink>
              </Button>
            </Stack>
          ) : null}

          <CompanySecondaryCtas company={company} />
          <CompanyProfileLocationsSection company={company} />

          <ProfileContent content={company.description} className="max-md:order-4" />

          <CompanyKeyBenefitsSection company={company} />
          <CompanyCaseStudiesSection company={company} />
          <CompanyPodcastSection company={company} />

          <CompanyFounderMetadata company={company} />

          {company.impactModel ? (
            <Stack direction="column" className="w-full max-md:order-7">
              <H5 as="strong">Impact model</H5>
              <ProfileContent content={company.impactModel} />
            </Stack>
          ) : null}

          {company.impactMetrics ? (
            <Stack direction="column" className="w-full max-md:order-8">
              <H5 as="strong">Impact metrics</H5>
              <ProfileContent content={company.impactMetrics} />
            </Stack>
          ) : null}

          <CompanyInvestorsSection company={company} />

          <CompanyTaxonomyBand company={company} />

          <Stack className="w-full max-md:order-11 md:sticky md:bottom-2 md:z-10">
            <div className="pointer-events-none absolute -inset-x-1 -bottom-3 -top-8 -z-1 bg-background mask-t-from-66% max-md:hidden" />
            <Nav className="mr-auto" title={metadata.title} />
          </Stack>
        </Section.Content>

        <Section.Sidebar className="max-md:contents">
          <Stack className="max-md:order-3 gap-4">
            <CompanyProfileStatsCard company={company} />
            <Suspense fallback={<AdCardSkeleton />}>
              <AdCard type="ToolPage" />
            </Suspense>
          </Stack>
        </Section.Sidebar>
      </Section>

      <Suspense fallback={<RelatedCompaniesSkeleton company={company} className="mt-10" />}>
        <RelatedCompanies company={company} className="mt-10" />
      </Suspense>

      <StructuredData data={structuredData} />
    </>
  )
}
