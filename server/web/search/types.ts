/** Lightweight shapes for search API responses (avoids deep Prisma/orpc inference in the client). */

export type SearchDirectoryCompany = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

export type SearchDirectoryFunder = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  website: string | null
}

export type SearchToolRow = {
  id: string
  name: string
  slug: string
  faviconUrl: string | null
  websiteUrl: string
}

export type SearchCategoryRow = {
  id: string
  name: string
  slug: string
}

export type SearchTagRow = {
  id: string
  name: string
  slug: string
}

/** Unified `searchItems` payload (admin and public branches use the same keys). */
export type SearchItemsOutput = {
  tools: SearchToolRow[]
  categories: SearchCategoryRow[]
  tags: SearchTagRow[]
  companies: SearchDirectoryCompany[]
  funders: SearchDirectoryFunder[]
}
