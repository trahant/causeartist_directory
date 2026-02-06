"use client"

import type { Table } from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "~/components/common/button"
import { Note } from "~/components/common/note"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { ButtonGroup } from "~/components/common/button-group"
import { Stack } from "~/components/common/stack"

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50],
}: DataTablePaginationProps<TData>) {
  const t = useTranslations("components.data_table.pagination")

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 tabular-nums sm:gap-4 lg:gap-6">
      <Note className="grow whitespace-nowrap max-sm:hidden">
        {t("rows_selected", {
          selected: table.getFilteredSelectedRowModel().rows.length,
          total: table.getFilteredRowModel().rows.length,
        })}
      </Note>

      <Stack className="max-sm:grow">
        <p className="text-sm font-medium">{t("per_page")}</p>

        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={value => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="w-auto tabular-nums">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>

          <SelectContent side="top" className="tabular-nums">
            {pageSizeOptions.map(pageSize => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>

      <div className="text-sm font-medium max-sm:hidden">
        {t("page_of", {
          page: table.getState().pagination.pageIndex + 1,
          total: table.getPageCount() || 1,
        })}
      </div>

      <ButtonGroup>
        <Button
          aria-label={t("go_to_first")}
          variant="secondary"
          size="md"
          className="max-lg:hidden"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          prefix={<ChevronsLeftIcon />}
        />

        <Button
          aria-label={t("go_to_previous")}
          variant="secondary"
          size="md"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          prefix={<ChevronLeftIcon />}
        />

        <Button
          aria-label={t("go_to_next")}
          variant="secondary"
          size="md"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          suffix={<ChevronRightIcon />}
        />

        <Button
          aria-label={t("go_to_last")}
          variant="secondary"
          size="md"
          className="max-lg:hidden"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          suffix={<ChevronsRightIcon />}
        />
      </ButtonGroup>
    </div>
  )
}
