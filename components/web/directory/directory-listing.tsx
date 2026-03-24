"use client"

import type { PropsWithChildren } from "react"
import { EntityDirectoryListing, EntityDirectoryListingSkeleton } from "~/components/web/directory/entity-directory-listing"
import type { PaginationProps } from "~/components/web/pagination"
import type { DirectoryLocationFacet, DirectorySectorFacet } from "~/server/web/directory/types"

type DirectoryListingProps = PropsWithChildren & {
  pagination: PaginationProps
  sectorFacets: DirectorySectorFacet[]
  locationFacets: DirectoryLocationFacet[]
}

export function DirectoryListing({
  children,
  pagination,
  sectorFacets,
  locationFacets,
}: DirectoryListingProps) {
  return (
    <EntityDirectoryListing
      listingVariant="home"
      listingId="directory"
      pagination={pagination}
      sectorFacets={sectorFacets}
      locationFacets={locationFacets}
    >
      {children}
    </EntityDirectoryListing>
  )
}

export function DirectoryListingSkeleton() {
  return <EntityDirectoryListingSkeleton listingId="directory" />
}
