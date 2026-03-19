import type { Metadata } from "next"
import { cache } from "react"
import { Badge } from "~/components/common/badge"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findFunders } from "~/server/web/funders/queries"
import type { FunderMany } from "~/server/web/funders/payloads"

const url = "/funders"
const title = "Impact Funders Directory"
const description =
  "Browse impact investors, foundations, and family offices funding the next generation of impact companies."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Funders" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

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

function FunderCard({ funder }: { funder: FunderMany }) {
  const title = funder.description ?? ""

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
            <Badge
              className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0"
            >
              {formatFunderType(funder.type)}
            </Badge>
          </div>
        </CardHeader>

        <CardDescription>{title}</CardDescription>

        <CardFooter>
          {funder.sectors.slice(0, 3).map(s => (
            <Badge key={s.sector.slug}>{s.sector.name}</Badge>
          ))}
        </CardFooter>
      </Link>
    </Card>
  )
}

export default async function FundersPage() {
  const funders = await findFunders({})
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {funders.length === 0 ? (
            <p className="text-muted-foreground">No funders found.</p>
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
