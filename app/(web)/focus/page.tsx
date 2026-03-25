import type { Metadata } from "next"
import { cache } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { db } from "~/services/db"

const url = "/focus"
const title = "Focus Areas | Impact Companies & Investors | Causeartist"
const description =
  "Browse focus areas where published companies and funders overlap. Open a topic to see listings on both sides."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [
      { url: "/", title: "Home" },
      { url, title: "Focus areas" },
    ],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

export default async function FocusHubPage() {
  const subcategories = await db.subcategory.findMany({
    where: {
      OR: [
        { companies: { some: { company: { status: "published" } } } },
        { funders: { some: { funder: { status: "published" } } } },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })

  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {subcategories.length === 0 ? (
            <p className="text-muted-foreground">No focus areas found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {subcategories.map(sub => (
                <Card key={sub.id} asChild>
                  <Link href={`/focus/${sub.slug}`}>
                    <CardHeader>
                      <span className="font-semibold text-sm">{sub.name}</span>
                    </CardHeader>
                    <CardDescription>
                      Companies and funders tagged with this focus area.
                    </CardDescription>
                    <CardFooter>
                      <span className="text-muted-foreground text-sm">View listings</span>
                    </CardFooter>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
