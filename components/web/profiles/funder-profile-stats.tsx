import { getTranslations } from "next-intl/server"
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
  if (funder.sectors.length > 0) {
    rows.push({ label: t("taxonomy_sectors"), value: String(funder.sectors.length) })
  }
  if (funder.locations.length > 0) {
    rows.push({ label: t("locations_count"), value: String(funder.locations.length) })
  }
  if (funder.stages.length > 0) {
    rows.push({ label: t("stages_count"), value: String(funder.stages.length) })
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
