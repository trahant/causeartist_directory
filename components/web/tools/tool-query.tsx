import type { SearchParams } from "nuqs"
import type { AdType, Prisma } from "~/.generated/prisma/client"
import { AdCard } from "~/components/web/ads/ad-card"
import type { PaginationProps } from "~/components/web/pagination"
import { StructuredData } from "~/components/web/structured-data"
import { ToolList, type ToolListProps } from "~/components/web/tools/tool-list"
import { ToolListing, type ToolListingProps } from "~/components/web/tools/tool-listing"
import { adsConfig } from "~/config/ads"
import { createGraph, generateItemList } from "~/lib/structured-data"
import { searchTools } from "~/server/web/tools/queries"
import { type ToolFilterParams, toolFilterParamsCache } from "~/server/web/tools/schema"

type ToolQueryProps = Omit<ToolListingProps, "list" | "pagination"> & {
  searchParams: Promise<SearchParams>
  overrideParams?: Partial<ToolFilterParams>
  where?: Prisma.ToolWhereInput
  list?: Partial<Omit<ToolListProps, "tools">>
  pagination?: Partial<Omit<PaginationProps, "total" | "pageSize">>
  ad?: AdType
  name?: string
}

const ToolQuery = async ({
  searchParams,
  overrideParams,
  where,
  list,
  pagination,
  ad,
  name,
  ...props
}: ToolQueryProps) => {
  const parsedParams = toolFilterParamsCache.parse(await searchParams)
  const params = { ...parsedParams, ...overrideParams }
  const { tools, total, page, perPage } = await searchTools(params, where)

  const items = tools.map(tool => ({
    name: tool.name,
    url: `/${tool.slug}`,
    description: tool.description,
  }))

  // Generate structured data for the tool list
  const structuredData = createGraph([generateItemList(items, name)])

  return (
    <ToolListing pagination={{ total, perPage, page, ...pagination }} {...props}>
      <StructuredData data={structuredData} />

      <ToolList tools={tools} {...list}>
        {ad &&
          Array.from({ length: adsConfig.adsPerPage }, (_, index) => {
            const order = Math.ceil((perPage / adsConfig.adsPerPage) * index + 1)
            if (order > tools.length) return null
            return <AdCard key={`ad-${index}`} type={ad} isRevealed style={{ order }} />
          })}
      </ToolList>
    </ToolListing>
  )
}

export { ToolQuery, type ToolQueryProps }
