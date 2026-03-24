import type { SearchParams } from "nuqs"
import { StructuredData } from "~/components/web/structured-data"
import { DirectoryListing } from "~/components/web/directory/directory-listing"
import { DirectoryResults } from "~/components/web/directory/directory-results"
import { createGraph, generateItemList } from "~/lib/structured-data"
import {
  findDirectoryLocationCounts,
  findDirectorySectorCounts,
  searchDirectory,
} from "~/server/web/directory/queries"
import { directoryFilterParamsCache } from "~/server/web/directory/schema"

type Props = {
  searchParams: Promise<SearchParams>
}

export async function DirectoryQuery({ searchParams }: Props) {
  const params = directoryFilterParamsCache.parse(await searchParams)
  const [{ items, total, page, perPage }, sectorFacets, locationFacets] = await Promise.all([
    searchDirectory(params),
    findDirectorySectorCounts(params.kind),
    findDirectoryLocationCounts(params.kind),
  ])

  const itemList = items.map(row =>
    row.type === "company"
      ? {
          name: row.item.name,
          url: `/companies/${row.item.slug}`,
          description: row.item.tagline ?? row.item.description,
        }
      : {
          name: row.item.name,
          url: `/funders/${row.item.slug}`,
          description: row.item.description,
        },
  )

  const structuredData = createGraph([generateItemList(itemList, "Directory")])

  return (
    <>
      <StructuredData data={structuredData} />

      <DirectoryListing
        sectorFacets={sectorFacets}
        locationFacets={locationFacets}
        pagination={{ total, perPage, page }}
      >
        <DirectoryResults items={items} listingKind={params.kind} />
      </DirectoryListing>
    </>
  )
}
