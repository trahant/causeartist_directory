import { ArrowUpRightIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { AlternativeOptionCardList } from "~/components/web/alternatives/alternative-option-card-list"
import { CompanyLogo } from "~/components/web/company-logo"
import { ExternalLink } from "~/components/web/external-link"
import { ProfileContent } from "~/components/web/profiles/profile-content"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import type { OpenGraphParams } from "~/lib/opengraph"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { findAlternativeTarget, findAlternativeTargetSlugs } from "~/server/web/alternatives/queries"

type Props = { params: Promise<{ slug: string }> }

const getData = cache(async ({ params }: Props) => {
  const { slug } = await params
  const target = await findAlternativeTarget({ slug })
  if (!target) notFound()

  const url = `/alternatives/${target.slug}`
  const title = `${target.name} alternatives`
  const description =
    target.alternativesSummary ??
    target.tagline ??
    `Explore curated alternatives to ${target.name} from the Causeartist directory.`

  const pageData = getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/alternatives", title: "Alternatives" },
      { url, title: target.name },
    ],
  })

  return { target, ...pageData }
})

export const generateStaticParams = async () => {
  const rows = await findAlternativeTargetSlugs()
  return rows.map(({ slug }) => ({ slug }))
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { target, url, metadata } = await getData(props)
  const description = target.alternativesSummary ?? target.tagline ?? metadata.description

  const ogImage: OpenGraphParams = {
    title: `${target.name} alternatives`,
    description: String(description),
  }

  return getPageMetadata({
    url,
    metadata: { ...metadata, title: `${target.name} alternatives`, description },
    ogImage,
  })
}

export default async function AlternativesDetailPage(props: Props) {
  const { target, breadcrumbs, structuredData, metadata } = await getData(props)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <Stack direction="row" wrap={false} className="items-center gap-3">
          <CompanyLogo logoUrl={target.logoUrl} name={target.name} className="size-10 rounded object-contain" />
          <IntroTitle>{metadata.title}</IntroTitle>
        </Stack>
        <IntroDescription>
          {target.alternativesSummary ??
            `A curated list of alternatives to ${target.name} from our impact company directory.`}
        </IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-2">
          <AlternativeOptionCardList target={target} />
        </Section.Content>
        <Section.Sidebar className="max-md:contents">
          <Stack className="gap-3 max-md:order-first">
            {target.website ? (
              <Button asChild>
                <ExternalLink href={target.website} doTrack doFollow>
                  Visit {target.name}
                  <ArrowUpRightIcon />
                </ExternalLink>
              </Button>
            ) : null}
            <Button variant="secondary" asChild>
              <Link href={`/companies/${target.slug}`}>
                View company profile
                <ArrowUpRightIcon />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/alternatives">Browse all alternatives</Link>
            </Button>
          </Stack>
        </Section.Sidebar>
      </Section>

      <Section>
        <Section.Content className="md:col-span-3">
          <ProfileContent content={target.description} />
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
