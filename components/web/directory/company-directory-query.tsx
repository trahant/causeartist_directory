import type { SearchParams } from "nuqs"
import { DirectoryResults } from "~/components/web/directory/directory-results"
import { EntityDirectoryListing } from "~/components/web/directory/entity-directory-listing"
import { companyListFilterParamsCache } from "~/server/web/companies/list-schema"
import {
  findDirectoryLocationCounts,
  findDirectorySectorCounts,
  searchCompanyDirectory,
} from "~/server/web/directory/queries"

type Props = {
  searchParams: Promise<SearchParams>
}

export async function CompanyDirectoryQuery({ searchParams }: Props) {
  const params = companyListFilterParamsCache.parse(await searchParams)
  const [{ items, total, page, perPage }, sectorFacets, locationFacets] = await Promise.all([
    searchCompanyDirectory(params),
    findDirectorySectorCounts("companies"),
    findDirectoryLocationCounts("companies"),
  ])

  return (
    <EntityDirectoryListing
      listingVariant="companies"
      pagination={{ total, perPage, page }}
      sectorFacets={sectorFacets}
      locationFacets={locationFacets}
    >
      <DirectoryResults items={items} listingKind="companies" />
    </EntityDirectoryListing>
  )
}
