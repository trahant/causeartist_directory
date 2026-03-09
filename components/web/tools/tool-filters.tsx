"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import plur from "plur"
import type { ComponentProps } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { useFilters } from "~/contexts/filter-context"
import { orpc } from "~/lib/orpc-query"
import type { ToolFilterSchema } from "~/server/web/tools/schema"

export const ToolFilters = ({ ...props }: ComponentProps<typeof Select>) => {
  const t = useTranslations("tools.filters")
  const { filters, updateFilters } = useFilters<ToolFilterSchema>()
  const { data } = useQuery(orpc.web.filters.findFilterOptions.queryOptions())

  return (
    <>
      {data?.map(({ type, options }) => (
        <Select
          key={type}
          value={filters[type]}
          onValueChange={value => updateFilters({ [type]: value })}
          {...props}
        >
          <SelectTrigger size="lg" className="w-auto min-w-40 max-sm:flex-1">
            <SelectValue placeholder={t(`all_${plur(type)}`)} />
          </SelectTrigger>

          <SelectContent align="end">
            {options.map(({ slug, name }) => (
              <SelectItem key={slug} value={slug}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </>
  )
}
