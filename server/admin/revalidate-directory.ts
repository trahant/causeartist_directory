import type { RevalidateOptions } from "~/lib/orpc"

/** Tags used by public directory, companies, funders, and certification listings. */
export const DIRECTORY_REVALIDATION_TAGS = [
  "directory",
  "directory-facets",
  "directory-sectors",
  "companies",
  "funders",
  "certifications",
] as const

export function revalidateDirectoryTaxonomy(
  revalidate: (opts: RevalidateOptions) => void,
  extraTags: string[] = [],
) {
  revalidate({
    tags: [...new Set([...DIRECTORY_REVALIDATION_TAGS, ...extraTags])],
  })
}

export function sectorPublicPaths(slug: string) {
  return ["/companies", "/funders", `/companies/sector/${slug}`, `/funders/sector/${slug}`] as const
}

export function focusPublicPaths(slug: string) {
  return [
    "/companies",
    "/funders",
    `/companies/focus/${slug}`,
    `/funders/focus/${slug}`,
    `/focus/${slug}`,
  ] as const
}

export function certificationPublicPaths(slug: string) {
  return ["/certifications", `/certifications/${slug}`] as const
}
