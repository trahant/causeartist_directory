import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Link } from "~/components/common/link"
import { CompanyCardGrid } from "~/components/web/companies/company-card-grid"
import { Listing } from "~/components/web/listing"
import type { CompanyOne } from "~/server/web/companies/payloads"
import { findRelatedCompanies } from "~/server/web/companies/queries"

type RelatedCompaniesProps = Omit<ComponentProps<typeof Listing>, "title"> & {
  company: CompanyOne
}

export async function RelatedCompanies({ company, ...props }: RelatedCompaniesProps) {
  const t = await getTranslations("components.listings")
  const companies = await findRelatedCompanies({ slug: company.slug })

  if (!companies.length) {
    return null
  }

  return (
    <Listing
      title={t("similar_companies")}
      button={<Link href="/companies">{t("view_all_companies")}</Link>}
      {...props}
    >
      <CompanyCardGrid companies={companies} />
    </Listing>
  )
}

export async function RelatedCompaniesSkeleton({ company: _company, ...props }: RelatedCompaniesProps) {
  const t = await getTranslations("components.listings")

  return (
    <Listing title={t("similar_companies")} {...props}>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    </Listing>
  )
}
