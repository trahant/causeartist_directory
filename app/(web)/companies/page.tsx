import type { Metadata } from "next"
import { cache } from "react"
import { Link } from "~/components/common/link"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findCompanies } from "~/server/web/companies/queries"
import type { CompanyMany } from "~/server/web/companies/payloads"

const url = "/companies"
const title = "Impact Companies Directory"
const description =
  "Browse impact-driven companies across clean energy, sustainable food, climate tech, and more."

const getData = cache(async () => {
  return getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Companies" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

function CompanyCard({ company }: { company: CompanyMany }) {
  const description = company.tagline ?? company.description ?? null
  const firstTwoSectors = company.sectors.slice(0, 2)
  const initials = company.name.trim().slice(0, 2).toUpperCase()

  return (
    <Link href={`/companies/${company.slug}`} className="block w-full h-full">
      <div
        className="flex h-full min-h-0 flex-col gap-4 p-5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer w-full"
      >
        <div className="flex items-center gap-3">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt={company.name}
              className="w-10 h-10 rounded-lg border border-neutral-200 bg-neutral-50 object-contain p-1 shrink-0"
              loading="lazy"
            />
          ) : (
            <span className="w-10 h-10 rounded-lg border border-neutral-200 bg-neutral-50 object-contain p-1 shrink-0 flex items-center justify-center text-xs font-bold text-neutral-500">
              {initials}
            </span>
          )}

          <div className="text-base font-semibold text-neutral-900 truncate">{company.name}</div>
        </div>

        {description ? (
          <div className="text-sm text-neutral-500 line-clamp-2 leading-relaxed -mt-2">
            {description}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {firstTwoSectors.map(({ sector }) => (
            <span
              key={sector.id}
              className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 font-medium"
            >
              {sector.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default async function CompaniesPage() {
  const companies = await findCompanies({})
  const { metadata, breadcrumbs, structuredData } = await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
      </Intro>

      <Section>
        <Section.Content className="md:col-span-3">
          {companies.length === 0 ? (
            <p className="text-muted-foreground">No companies found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full items-stretch">
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
