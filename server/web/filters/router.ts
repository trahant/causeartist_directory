import { baseProcedure } from "~/lib/orpc"
import { findCategories } from "~/server/web/categories/queries"
import type { ToolFilterParams } from "~/server/web/tools/schema"

type FilterOption = {
  slug: string
  name: string
  count: number
}

type FilterOptions = Array<{
  type: Exclude<keyof ToolFilterParams, "q" | "sort" | "page" | "perPage">
  options: FilterOption[]
}>

const findFilterOptions = baseProcedure.handler(async () => {
  const [categories] = await Promise.all([findCategories({})])

  const filterOptions: FilterOptions = [
    {
      type: "category",
      options: categories.map(category => ({
        slug: category.slug,
        name: category.name,
        count: category._count.tools,
      })),
    },
  ]

  return filterOptions.filter(({ options }) => options.length)
})

export const filterRouter = {
  findFilterOptions,
}
