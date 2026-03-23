"use client"

import { ArrowUpDownIcon, ListFilterIcon, LoaderIcon, SearchIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Button } from "~/components/common/button"
import { Input } from "~/components/common/input"
import { useFilters } from "~/contexts/filter-context"
import { isDefaultState } from "~/lib/parsers"
import { cx } from "~/lib/utils"
import { LocationCountryFlag } from "~/components/web/location-country-flag"
import type { DirectoryLocationFacet, DirectorySectorFacet } from "~/server/web/directory/types"
import {
  directoryFilterParams,
  directorySortValues,
  type DirectoryFilterSchema,
} from "~/server/web/directory/schema"

const kindOptions = ["all", "companies", "funders"] as const

const selectTriggerClass = cx(
  "h-10 min-w-[9.5rem] shrink-0 rounded-lg border border-input bg-background px-3 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "text-foreground font-medium",
)

export function DirectoryFilterBar({
  sectorFacets,
  locationFacets,
}: {
  sectorFacets: DirectorySectorFacet[]
  locationFacets: DirectoryLocationFacet[]
}) {
  const t = useTranslations("directory.filters")
  const tToolbar = useTranslations("directory.toolbar")
  const { filters, isLoading, updateFilters } = useFilters<DirectoryFilterSchema>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sectorSearch, setSectorSearch] = useState("")
  const [locationSearch, setLocationSearch] = useState("")

  const isDefault = isDefaultState(directoryFilterParams, filters, ["page", "perPage"])

  const filteredSectors = useMemo(() => {
    const q = sectorSearch.trim().toLowerCase()
    if (!q) return sectorFacets
    return sectorFacets.filter(
      s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
    )
  }, [sectorFacets, sectorSearch])

  const filteredLocations = useMemo(() => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return locationFacets
    return locationFacets.filter(
      l => l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q),
    )
  }, [locationFacets, locationSearch])

  const showResetInSearch = !isDefault

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
        <div
          className={cx(
            "flex min-h-10 min-w-0 flex-1 overflow-hidden rounded-lg border border-input bg-background",
            "ring-offset-background focus-within:ring-2 focus-within:ring-ring",
          )}
        >
          <div className="relative flex min-w-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 opacity-50">
              {isLoading ? <LoaderIcon className="size-4 animate-spin" /> : <SearchIcon className="size-4" />}
            </div>
            <Input
              size="lg"
              value={filters.q ?? ""}
              onChange={e => updateFilters({ q: e.target.value })}
              placeholder={isLoading ? tToolbar("loading") : tToolbar("search_placeholder")}
              className={cx(
                "h-10 min-h-10 rounded-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0",
                "pl-9",
                showResetInSearch ? "pr-11" : "pr-3",
              )}
              aria-label={tToolbar("search_aria")}
            />
            {showResetInSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-8 -translate-y-1/2 shrink-0 px-2"
                onClick={() => updateFilters(null)}
                prefix={<XIcon className="size-4" />}
              >
                <span className="sr-only">{tToolbar("clear")}</span>
              </Button>
            )}
          </div>

          <div className="w-px shrink-0 self-stretch bg-border my-2" aria-hidden />

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-10 shrink-0 rounded-none px-3 font-semibold text-foreground hover:bg-muted/60"
            onClick={() => setFiltersOpen(open => !open)}
            prefix={
              filtersOpen ? (
                <XIcon className="size-4 opacity-70" />
              ) : (
                <ListFilterIcon className="size-4 opacity-70" />
              )
            }
          >
            {tToolbar("filters")}
          </Button>
        </div>

        <label className={cx("flex items-center gap-2", selectTriggerClass)}>
          <span className="text-muted-foreground font-medium max-sm:hidden">{tToolbar("order_by")}</span>
          <ArrowUpDownIcon className="size-4 shrink-0 opacity-50 sm:order-last" aria-hidden />
          <select
            className="min-w-0 flex-1 cursor-pointer bg-transparent font-semibold text-foreground outline-none"
            value={filters.sort}
            onChange={e =>
              updateFilters({
                sort: e.target.value as (typeof filters)["sort"],
              })
            }
            aria-label={tToolbar("order_by")}
          >
            {directorySortValues.map(value => (
              <option key={value} value={value}>
                {tToolbar(`sort_${value.replace(".", "_")}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtersOpen && (
        <div className="overflow-hidden rounded-lg border border-input bg-background shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground">{t("kind_label")}</h3>
              <ul className="flex flex-col gap-2" role="radiogroup" aria-label={t("kind_label")}>
                {kindOptions.map(kind => (
                  <li key={kind}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="directory-kind"
                        className="size-4 shrink-0 rounded-full border-input text-primary accent-primary"
                        checked={filters.kind === kind}
                        onChange={() => updateFilters({ kind })}
                      />
                      <span>{t(`kind_${kind}` as "kind_all")}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground">{t("sector_label")}</h3>
              <Input
                size="sm"
                value={sectorSearch}
                onChange={e => setSectorSearch(e.target.value)}
                placeholder={t("sector_search_placeholder")}
                className="w-full"
                aria-label={t("sector_search_placeholder")}
              />
              <ul
                className="max-h-64 space-y-1 overflow-y-auto pr-1"
                role="radiogroup"
                aria-label={t("sector_label")}
              >
                <li>
                  <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md py-1 text-sm hover:bg-muted/50">
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="radio"
                        name="directory-sector"
                        className="size-4 shrink-0 border-input text-primary accent-primary"
                        checked={!filters.sector}
                        onChange={() => updateFilters({ sector: "" })}
                      />
                      <span className="truncate">{t("sector_all")}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {tToolbar("all_sectors_count")}
                    </span>
                  </label>
                </li>
                {filteredSectors.map(s => (
                  <li key={s.slug}>
                    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md py-1 text-sm hover:bg-muted/50">
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="radio"
                          name="directory-sector"
                          className="size-4 shrink-0 border-input text-primary accent-primary"
                          checked={filters.sector === s.slug}
                          onChange={() => updateFilters({ sector: s.slug })}
                        />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {s.count}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground">{t("location_label")}</h3>
              <Input
                size="sm"
                value={locationSearch}
                onChange={e => setLocationSearch(e.target.value)}
                placeholder={t("location_search_placeholder")}
                className="w-full"
                aria-label={t("location_search_placeholder")}
              />
              <ul
                className="max-h-64 space-y-1 overflow-y-auto pr-1"
                role="radiogroup"
                aria-label={t("location_label")}
              >
                <li>
                  <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md py-1 text-sm hover:bg-muted/50">
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="radio"
                        name="directory-location"
                        className="size-4 shrink-0 border-input text-primary accent-primary"
                        checked={!filters.location}
                        onChange={() => updateFilters({ location: "" })}
                      />
                      <LocationCountryFlag countryCode={null} />
                      <span className="truncate">{t("location_all")}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {tToolbar("all_locations_count")}
                    </span>
                  </label>
                </li>
                {filteredLocations.map(loc => (
                  <li key={loc.slug}>
                    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md py-1 text-sm hover:bg-muted/50">
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="radio"
                          name="directory-location"
                          className="size-4 shrink-0 border-input text-primary accent-primary"
                          checked={filters.location === loc.slug}
                          onChange={() => updateFilters({ location: loc.slug })}
                        />
                        <LocationCountryFlag countryCode={loc.countryCode} />
                        <span className="truncate">{loc.name}</span>
                      </span>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {loc.count}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!isDefault && (
            <div className="flex justify-end border-t border-border bg-muted/20 px-4 py-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => updateFilters(null)}>
                {tToolbar("clear_all")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
