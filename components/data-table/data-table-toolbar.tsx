"use client"

import { useHotkeys } from "@mantine/hooks"
import type { Table } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import * as React from "react"
import { type ComponentProps, useRef } from "react"
import { Button } from "~/components/common/button"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Stack } from "~/components/common/stack"
import { DataTableFacetedFilter } from "~/components/data-table/data-table-faceted-filter"
import { cx } from "~/lib/utils"
import type { DataTableFilterField } from "~/types"

type DataTableToolbarProps<TData> = ComponentProps<"div"> & {
  table: Table<TData>
  filterFields?: DataTableFilterField<TData>[]
}

export function DataTableToolbar<TData>({
  table,
  filterFields = [],
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const t = useTranslations("components.data_table.toolbar")
  const isFiltered = table.getState().columnFilters.length > 0
  const inputRef = useRef<HTMLInputElement>(null)

  // Add hotkey to focus search input
  useHotkeys([["/", () => inputRef.current?.focus()]], [], true)

  // Memoize computation of searchableColumns and filterableColumns
  const { searchableColumns, filterableColumns } = React.useMemo(() => {
    return {
      searchableColumns: filterFields.filter(field => !field.options),
      filterableColumns: filterFields.filter(field => field.options),
    }
  }, [filterFields])

  return (
    <Stack
      size="sm"
      wrap={false}
      className={cx("justify-between w-full py-1 -my-1 overflow-auto", className)}
      {...props}
    >
      <Stack size="sm" wrap={false}>
        {searchableColumns.map(
          column =>
            table.getColumn(column.id) && (
              <div key={String(column.id)} className="relative">
                <Input
                  ref={inputRef}
                  className="w-40 lg:w-60"
                  placeholder={column.placeholder}
                  value={String(table.getColumn(column.id)?.getFilterValue() ?? "")}
                  onChange={e => table.getColumn(column.id)?.setFilterValue(e.target.value)}
                />

                <Kbd
                  className="absolute right-2 top-1/2 -translate-y-1/2 m-0 pointer-events-none"
                  keys={["/"]}
                />
              </div>
            ),
        )}

        {filterableColumns.map(
          column =>
            table.getColumn(column.id) && (
              <DataTableFacetedFilter
                key={String(column.id)}
                column={table.getColumn(column.id)}
                title={column.label}
                options={column.options ?? []}
              />
            ),
        )}

        {isFiltered && (
          <Button
            aria-label={t("reset_filters")}
            variant="ghost"
            size="md"
            onClick={() => table.resetColumnFilters()}
            suffix={<XIcon />}
          >
            {t("reset")}
          </Button>
        )}
      </Stack>

      <Stack size="sm" wrap={false}>
        {children}
      </Stack>
    </Stack>
  )
}
