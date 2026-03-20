"use client"

import { useTranslations } from "next-intl"
import { Stack } from "~/components/common/stack"
import { Filters } from "~/components/web/filters/filters"
import { useFilters } from "~/contexts/filter-context"
import { cx } from "~/lib/utils"
import type { DirectoryFilterSchema } from "~/server/web/directory/schema"

const selectClassName = cx(
  "h-10 min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
)

type SectorOption = { name: string; slug: string }

export function DirectoryFilterBar({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("directory.filters")
  const { filters, updateFilters } = useFilters<DirectoryFilterSchema>()

  return (
    <Stack className="w-full gap-3">
      <Filters placeholder={t("search_placeholder")} />

      <div className="flex flex-wrap gap-2 w-full items-center">
        <label className="sr-only" htmlFor="directory-kind">
          {t("kind_label")}
        </label>
        <select
          id="directory-kind"
          className={selectClassName}
          value={filters.kind}
          onChange={e =>
            updateFilters({
              kind: e.target.value as (typeof filters)["kind"],
            })
          }
        >
          <option value="all">{t("kind_all")}</option>
          <option value="companies">{t("kind_companies")}</option>
          <option value="funders">{t("kind_funders")}</option>
        </select>

        <label className="sr-only" htmlFor="directory-sector">
          {t("sector_label")}
        </label>
        <select
          id="directory-sector"
          className={cx(selectClassName, "min-w-[12rem] flex-1 max-w-xs")}
          value={filters.sector}
          onChange={e => updateFilters({ sector: e.target.value || "" })}
        >
          <option value="">{t("sector_all")}</option>
          {sectors.map(s => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </Stack>
  )
}
