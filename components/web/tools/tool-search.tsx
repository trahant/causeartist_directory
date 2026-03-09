"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import type { Stack } from "~/components/common/stack"
import { Filters } from "~/components/web/filters/filters"
import { Sort } from "~/components/web/filters/sort"
import { ToolFilters } from "~/components/web/tools/tool-filters"
import { useFilters } from "~/contexts/filter-context"
import { toolSort, type ToolFilterSchema } from "~/server/web/tools/schema"

export type ToolSearchProps = ComponentProps<typeof Stack> & {
  placeholder?: string
}

export const ToolSearch = ({ placeholder, ...props }: ToolSearchProps) => {
  const t = useTranslations("tools.filters")
  const { enableSort, enableFilters } = useFilters<ToolFilterSchema>()
  const toolSortOptions = Object.entries(toolSort.options)

  const sortOptions = toolSortOptions.map(([value, { label }]) => ({
    value,
    label: t(label),
  }))

  return (
    <Filters placeholder={placeholder || t("search_placeholder")} {...props}>
      {enableFilters && <ToolFilters />}
      {enableSort && <Sort options={sortOptions} />}
    </Filters>
  )
}
