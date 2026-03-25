import { getTranslations } from "next-intl/server"
import { Badge } from "~/components/common/badge"
import { Link } from "~/components/common/link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import type { CompanyOne } from "~/server/web/companies/payloads"

export async function CompanyProfileStatsCard({ company }: { company: CompanyOne }) {
  const t = await getTranslations("profiles")
  const rows: { label: string; value: string }[] = []

  if (company.foundedYear != null) {
    rows.push({ label: t("founded"), value: String(company.foundedYear) })
  }
  if (company.funders.length > 0) {
    rows.push({ label: t("investors_count"), value: String(company.funders.length) })
  }
  if (company.caseStudies.length > 0) {
    rows.push({ label: t("case_studies_count"), value: String(company.caseStudies.length) })
  }

  const hasTaxonomy =
    company.sectors.length > 0 ||
    company.subcategories.length > 0 ||
    company.locations.length > 0

  if (!hasTaxonomy && !rows.length) return null

  return (
    <div className="mb-10 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="border-b border-border pb-3 text-sm font-semibold text-foreground">
        {t("at_a_glance")}
      </h3>

      {company.sectors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("taxonomy_sectors")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {company.sectors.map(({ sector }) => (
              <Badge key={sector.id} size="md" variant="soft" asChild>
                <Link href={`/companies/sector/${sector.slug}`}>{sector.name}</Link>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {company.subcategories.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("taxonomy_subcategories")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {company.subcategories.map(({ subcategory }) => (
              <Badge key={subcategory.id} size="md" variant="outline" asChild>
                <Link href={`/companies/focus/${subcategory.slug}`}>{subcategory.name}</Link>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {company.locations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("locations_heading")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {company.locations.map(({ location }) => (
              <Badge key={location.slug} size="md" variant="outline" asChild>
                <Link
                  href={`/companies/location/${location.slug}`}
                  className="inline-flex max-w-full min-w-0 items-center gap-1.5"
                >
                  <LocationCountryFlag countryCode={location.countryCode} />
                  <span className="truncate">{location.name}</span>
                </Link>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="border-t border-border pt-4">
            <dl className="space-y-2">
              {rows.map(row => (
                <div key={row.label} className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      ) : null}
    </div>
  )
}
