import type { SearchParams } from "nuqs"
import { DirectoryResults } from "~/components/web/directory/directory-results"
import { EntityDirectoryListing } from "~/components/web/directory/entity-directory-listing"
import {
  findDirectoryLocationCounts,
  findDirectorySectorCounts,
  searchFunderDirectory,
} from "~/server/web/directory/queries"
import { funderListFilterParamsCache } from "~/server/web/funders/list-schema"

type Props = {
  searchParams: Promise<SearchParams>
}

export async function FunderDirectoryQuery({ searchParams }: Props) {
  const params = funderListFilterParamsCache.parse(await searchParams)
  const [{ items, total, page, perPage }, sectorFacets, locationFacets] = await Promise.all([
    searchFunderDirectory(params),
    findDirectorySectorCounts("funders"),
    findDirectoryLocationCounts("funders"),
  ])

  return (
    <EntityDirectoryListing
      listingVariant="funders"
      pagination={{ total, perPage, page }}
      sectorFacets={sectorFacets}
      locationFacets={locationFacets}
    >
      <DirectoryResults items={items} listingKind="funders" />
    </EntityDirectoryListing>
  )
}
