import { getTranslations } from "next-intl/server"
import { Badge } from "~/components/common/badge"
import { Link } from "~/components/common/link"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import { formatFunderCheckSize } from "~/lib/format-funder-check-size"
import type { FunderOne } from "~/server/web/funders/payloads"

export async function FunderProfileStatsCard({ funder }: { funder: FunderOne }) {
  const t = await getTranslations("profiles")
  const rows: { label: string; value: string }[] = []

  if (funder.foundedYear != null) {
    rows.push({ label: t("founded"), value: String(funder.foundedYear) })
  }
  if (funder.aum) {
    rows.push({ label: t("aum_label"), value: funder.aum })
  }
  const check = formatFunderCheckSize(funder.checkSizeMin, funder.checkSizeMax)
  if (check) {
    rows.push({ label: t("check_size"), value: check })
  }
  if (funder.portfolio.length > 0) {
    rows.push({ label: t("portfolio_count"), value: String(funder.portfolio.length) })
  }

  const hasTaxonomy =
    funder.sectors.length > 0 ||
    funder.subcategories.length > 0 ||
    funder.locations.length > 0 ||
    funder.stages.length > 0

  if (!hasTaxonomy && !rows.length) return null

  return (
    <div className="mb-10 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="border-b border-border pb-3 text-sm font-semibold text-foreground">
        {t("at_a_glance")}
      </h3>

      {funder.sectors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("taxonomy_sectors")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {funder.sectors.map(({ sector }) => (
              <Badge key={sector.id} size="md" variant="soft" asChild>
                <Link href={`/funders/sector/${sector.slug}`}>{sector.name}</Link>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {funder.subcategories.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("taxonomy_subcategories")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {funder.subcategories.map(({ subcategory }) => (
              <Badge key={subcategory.id} size="md" variant="outline" asChild>
                <Link href={`/funders/focus/${subcategory.slug}`}>{subcategory.name}</Link>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {funder.stages.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("investment_stages_heading")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {funder.stages.map(({ fundingStage }) => (
              <Badge key={fundingStage.slug} size="md" variant="outline" asChild>
                <Link href={`/funders/stage/${fundingStage.slug}`}>{fundingStage.name}</Link>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {funder.locations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("locations_heading")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {funder.locations.map(({ location }) => (
              <Badge key={location.slug} size="md" variant="outline" asChild>
                <Link
                  href={`/funders/location/${location.slug}`}
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
      ) : null}
    </div>
  )
}
