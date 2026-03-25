"use client"

import type { PropsWithChildren } from "react"
import { EntityDirectoryListing, EntityDirectoryListingSkeleton } from "~/components/web/directory/entity-directory-listing"
import type { PaginationProps } from "~/components/web/pagination"
import type {
  DirectoryFunderTypeFacet,
  DirectoryLocationFacet,
  DirectorySectorFacet,
} from "~/server/web/directory/types"

type DirectoryListingProps = PropsWithChildren & {
  pagination: PaginationProps
  sectorFacets: DirectorySectorFacet[]
  locationFacets: DirectoryLocationFacet[]
  funderTypeFacets: DirectoryFunderTypeFacet[]
}

export function DirectoryListing({
  children,
  pagination,
  sectorFacets,
  locationFacets,
  funderTypeFacets,
}: DirectoryListingProps) {
  return (
    <EntityDirectoryListing
      listingVariant="home"
      listingId="directory"
      pagination={pagination}
      sectorFacets={sectorFacets}
      locationFacets={locationFacets}
      funderTypeFacets={funderTypeFacets}
    >
      {children}
    </EntityDirectoryListing>
  )
}

export function DirectoryListingSkeleton() {
  return <EntityDirectoryListingSkeleton listingId="directory" />
}
