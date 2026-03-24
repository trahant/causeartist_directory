"use client"

import type { PropsWithChildren } from "react"
import { Input } from "~/components/common/input"
import { FiltersProvider } from "~/contexts/filter-context"
import { Pagination, type PaginationProps } from "~/components/web/pagination"
import { DirectoryFilterBar } from "~/components/web/directory/directory-filter-bar"
import { companyListFilterParams } from "~/server/web/companies/list-schema"
import { directoryFilterParams } from "~/server/web/directory/schema"
import type { DirectoryLocationFacet, DirectorySectorFacet } from "~/server/web/directory/types"
import { funderListFilterParams } from "~/server/web/funders/list-schema"
import { useTranslations } from "next-intl"

export type DirectoryListingVariant = "home" | "companies" | "funders"

const schemaByVariant = {
  home: directoryFilterParams,
  companies: companyListFilterParams,
  funders: funderListFilterParams,
} as const

type EntityDirectoryListingProps = PropsWithChildren & {
  pagination: PaginationProps
  sectorFacets: DirectorySectorFacet[]
  locationFacets: DirectoryLocationFacet[]
  /** Pick nuqs schema inside the client bundle (do not pass parsers from RSC). */
  listingVariant: DirectoryListingVariant
  listingId?: string
}

export function EntityDirectoryListing({
  children,
  pagination,
  sectorFacets,
  locationFacets,
  listingVariant,
  listingId,
}: EntityDirectoryListingProps) {
  const schema = schemaByVariant[listingVariant]
  const enableKindToggle = listingVariant === "home"

  return (
    <FiltersProvider schema={schema} enableSort={false} enableFilters={false}>
      <div className="space-y-5" id={listingId}>
        <DirectoryFilterBar
          sectorFacets={sectorFacets}
          locationFacets={locationFacets}
          enableKindToggle={enableKindToggle}
          variant={listingVariant}
        />
        {children}
      </div>

      <Pagination {...pagination} />
    </FiltersProvider>
  )
}

export function EntityDirectoryListingSkeleton({ listingId }: { listingId?: string }) {
  const t = useTranslations("common")

  return (
    <div className="space-y-5" id={listingId}>
      <Input size="lg" placeholder={t("loading")} disabled />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  )
}
