"use client"

import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import type { Stack } from "~/components/common/stack"
import { Filters } from "~/components/web/filters/filters"
import { Sort } from "~/components/web/filters/sort"
import { TagFilters } from "~/components/web/tags/tag-filters"
import { useFilters } from "~/contexts/filter-context"
import { tagSort, type TagsFilterSchema } from "~/server/web/tags/schema"

export type TagSearchProps = ComponentProps<typeof Stack> & {
  placeholder?: string
}

export const TagSearch = ({ placeholder, ...props }: TagSearchProps) => {
  const { enableSort, enableFilters } = useFilters<TagsFilterSchema>()
  const t = useTranslations("tags.filters")
  const tagSortOptions = Object.entries(tagSort.options)

  const sortOptions = tagSortOptions.map(([value, { label }]) => ({
    value,
    label: t(label),
  }))

  return (
    <Filters placeholder={placeholder || t("search_placeholder")} {...props}>
      {enableSort && <Sort options={sortOptions} />}
      {enableFilters && <TagFilters />}
    </Filters>
  )
}
