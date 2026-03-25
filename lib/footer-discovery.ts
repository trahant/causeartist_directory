import type { DirectoryLocationFacet, DirectorySectorFacet } from "~/server/web/directory/types"

const DEFAULT_CAP = 28

export type FooterDiscoveryItem = { href: string; label: string; count: number }

export function prepareFooterSectorLinks(
  facets: DirectorySectorFacet[],
  options?: { cap?: number },
): FooterDiscoveryItem[] {
  const cap = options?.cap ?? DEFAULT_CAP
  return facets
    .filter(f => f.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, cap)
    .map(f => ({
      href: `/companies/sector/${f.slug}`,
      label: f.name,
      count: f.count,
    }))
}

export function prepareFooterLocationLinks(
  facets: DirectoryLocationFacet[],
  options?: { cap?: number },
): FooterDiscoveryItem[] {
  const cap = options?.cap ?? DEFAULT_CAP
  return facets
    .filter(f => f.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, cap)
    .map(f => ({
      href: `/companies/location/${f.slug}`,
      label: f.name,
      count: f.count,
    }))
}
