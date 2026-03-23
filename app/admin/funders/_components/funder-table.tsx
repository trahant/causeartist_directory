"use client"

import { formatDate } from "@primoui/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { DateRangePicker } from "~/components/admin/date-range-picker"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import { formatFunderType } from "~/lib/format-funder-type"
import { isDefaultState } from "~/lib/parsers"
import type { FunderListRow } from "~/server/admin/funders/schema"
import { funderListParams } from "~/server/admin/funders/schema"
import type { DataTableFilterField } from "~/types"

const columns: ColumnDef<FunderListRow>[] = [
  {
    accessorKey: "name",
    enableHiding: false,
    size: 200,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <DataTableLink href={`/admin/funders/${row.original.id}`} title={row.original.name} />
    ),
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    cell: ({ row }) => <Note className="font-mono text-xs">{row.original.slug}</Note>,
  },
  {
    accessorKey: "type",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <Note className="text-xs">{row.original.type ? formatFunderType(row.original.type) : "—"}</Note>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === "published" ? "success" : "soft"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("updatedAt"))}</Note>,
  },
  {
    id: "public",
    enableSorting: false,
    size: 48,
    header: () => null,
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
        <Link href={`/funders/${row.original.slug}`} target="_blank" rel="noreferrer">
          <ExternalLinkIcon className="size-4" />
          <span className="sr-only">View on site</span>
        </Link>
      </Button>
    ),
  },
]

export function FunderTable() {
  const [params, setParams] = useQueryStates(funderListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.admin.funders.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<FunderListRow>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Search by name...",
    },
  ]

  const { table } = useDataTable({
    data: data?.funders ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
    },
    getRowId: row => row.id,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader title="Funders" total={data?.fundersTotal}>
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(funderListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
