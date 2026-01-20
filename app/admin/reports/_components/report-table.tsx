"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { useQueryStates } from "nuqs"
import { use } from "react"
import type { Report, Tool } from "~/.generated/prisma/browser"
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
import { reportsConfig } from "~/config/reports"
import { useDataTable } from "~/hooks/use-data-table"
import type { findReports } from "~/server/admin/reports/queries"
import { reportTableParamsSchema } from "~/server/admin/reports/schema"
import type { DataTableFilterField } from "~/types"
import { ReportTableToolbarActions } from "./report-table-toolbar-actions"

type ReportTableProps = {
  reportsPromise: ReturnType<typeof findReports>
}

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
    size: 80,
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <DataTableLink
        href={`/admin/reports/${row.original.id}`}
        title={`#${row.original.id.slice(-6).toUpperCase()}`}
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
    cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
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

export function ReportTable({ reportsPromise }: ReportTableProps) {
  const { reports, reportsTotal, pageCount } = use(reportsPromise)
  const [{ perPage, sort }] = useQueryStates(reportTableParamsSchema)

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
      options: reportsConfig.reportTypes.map(type => ({
        label: type,
        value: type,
      })),
    },
  ]

  const { table } = useDataTable({
    data: reports,
    columns,
    pageCount,
    filterFields,
    shallow: false,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
  })

  return (
    <DataTable table={table}>
      <DataTableHeader title="Reports" total={reportsTotal}>
        <DataTableToolbar table={table} filterFields={filterFields}>
          <ReportTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
