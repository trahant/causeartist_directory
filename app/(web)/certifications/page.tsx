import type { Metadata } from "next"
import { cache } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { Link } from "~/components/common/link"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findCertifications } from "~/server/web/certifications/queries"
import type { CertificationMany } from "~/server/web/certifications/payloads"
import { db } from "~/services/db"

const url = "/certifications"
const title = "Impact Business Certifications | Causeartist"
const description =
  "Browse companies certified as B Corps, Fair Trade, Carbon Neutral, and more."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Certifications" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

function CertificationCard({
  certification,
  companyCount,
}: {
  certification: CertificationMany
  companyCount: number
}) {
  return (
    <Card asChild>
      <Link href={`/certifications/${certification.slug}`}>
        <CardHeader>
          <span className="font-semibold text-sm">{certification.name}</span>
        </CardHeader>
        <CardDescription>
          {certification.description ?? "Learn which companies hold this certification."}
        </CardDescription>
        <CardFooter>
          <span>
            {companyCount} {companyCount === 1 ? "company" : "companies"}
          </span>
        </CardFooter>
      </Link>
    </Card>
  )
}

export default async function CertificationsPage() {
  const certifications = await findCertifications({})
  const counts = await db.companyCertification.groupBy({
    by: ["certificationId"],
    _count: { companyId: true },
  })
  const countByCertId = new Map(
    counts.map(row => [row.certificationId, row._count.companyId]),
  )

  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {certifications.length === 0 ? (
            <p className="text-muted-foreground">No certifications found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {certifications.map(cert => (
                <CertificationCard
                  key={cert.id}
                  certification={cert}
                  companyCount={countByCertId.get(cert.id) ?? 0}
                />
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
