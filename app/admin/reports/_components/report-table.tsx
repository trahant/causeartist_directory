"use client"

import { formatDate } from "@primoui/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { capitalCase } from "change-case"
import { useQueryStates } from "nuqs"
import type { Report, Tool } from "~/.generated/prisma/browser"
import { ReportType } from "~/.generated/prisma/browser"
import { ReportActions } from "~/app/admin/reports/_components/report-actions"
import { DateRangePicker } from "~/components/admin/date-range-picker"
import { RowCheckbox } from "~/components/admin/row-checkbox"
import { Badge } from "~/components/common/badge"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import { isDefaultState } from "~/lib/parsers"
import { reportListParams } from "~/server/admin/reports/schema"
import type { DataTableFilterField } from "~/types"
import { ReportTableToolbarActions } from "./report-table-toolbar-actions"

const columns: ColumnDef<Report>[] = [
  {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <RowCheckbox
        checked={table.getIsAllPageRowsSelected()}
        ref={input => {
          if (input) {
            input.indeterminate =
              table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
          }
        }}
        onChange={e => table.toggleAllPageRowsSelected(e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row, table }) => (
      <RowCheckbox
        checked={row.getIsSelected()}
        onChange={e => row.toggleSelected(e.target.checked)}
        aria-label="Select row"
        table={table}
        row={row}
      />
    ),
  },
  {
    accessorKey: "id",
    enableSorting: false,
    enableHiding: false,
    size: 100,
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <DataTableLink
        href={`/admin/reports/${row.original.id}`}
        title={`#${row.original.id.slice(-6).toUpperCase()}`}
        className="font-mono"
      />
    ),
  },
  {
    accessorKey: "message",
    enableSorting: false,
    size: 320,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Message" />,
    cell: ({ row }) => <Note className="truncate">{row.getValue("message")}</Note>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reported At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge variant="outline">{capitalCase(row.getValue("type"))}</Badge>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <Note>{row.getValue("email")}</Note>,
  },
  {
    accessorKey: "tool",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tool" />,
    cell: ({ row }) => {
      const tool = row.getValue<Pick<Tool, "id" | "slug" | "name">>("tool")

      return (
        <DataTableLink href={`/admin/tools/${tool?.id}`} title={tool?.name} isOverlay={false} />
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ReportActions report={row.original} className="float-right" />,
  },
]

export function ReportTable() {
  const [params, setParams] = useQueryStates(reportListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.admin.reports.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const reports = data?.reports ?? []
  const reportsTotal = data?.reportsTotal
  const pageCount = data?.pageCount ?? 0

  // Search filters
  const filterFields: DataTableFilterField<Report>[] = [
    {
      id: "message",
      label: "Message",
      placeholder: "Search by message...",
    },
    {
      id: "type",
      label: "Type",
      options: Object.values(ReportType).map(type => ({
        label: capitalCase(type),
        value: type,
      })),
    },
  ]

  const { table } = useDataTable({
    data: reports,
    columns,
    pageCount,
    filterFields,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader title="Reports" total={reportsTotal}>
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(reportListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <ReportTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
