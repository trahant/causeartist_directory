import { getTranslations } from "next-intl/server"
import type { CompanyOne } from "~/server/web/companies/payloads"

export async function CompanyProfileStatsCard({ company }: { company: CompanyOne }) {
  const t = await getTranslations("profiles")
  const rows: { label: string; value: string }[] = []

  if (company.foundedYear != null) {
    rows.push({ label: t("founded"), value: String(company.foundedYear) })
  }
  if (company.totalFunding) {
    rows.push({ label: t("total_funding"), value: company.totalFunding })
  }
  if (company.locations.length > 0) {
    rows.push({ label: t("locations_count"), value: String(company.locations.length) })
  }
  if (company.funders.length > 0) {
    rows.push({ label: t("investors_count"), value: String(company.funders.length) })
  }
  if (company.caseStudies.length > 0) {
    rows.push({ label: t("case_studies_count"), value: String(company.caseStudies.length) })
  }

  if (!rows.length) return null

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("at_a_glance")}</h3>
      <dl className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
