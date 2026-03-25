import type { FunderTypeSlug } from "~/lib/format-funder-type"

export type DirectorySectorFacet = { slug: string; name: string; count: number }

export type DirectoryFunderTypeFacet = { slug: FunderTypeSlug; count: number }

export type DirectoryLocationFacet = {
  slug: string
  name: string
  countryCode: string | null
  count: number
}
