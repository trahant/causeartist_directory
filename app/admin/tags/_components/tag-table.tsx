"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { HashIcon, PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type { Tag } from "~/.generated/prisma/browser"
import { TagActions } from "~/app/admin/tags/_components/tag-actions"
import { TagTableToolbarActions } from "~/app/admin/tags/_components/tag-table-toolbar-actions"
import { DateRangePicker } from "~/components/admin/date-range-picker"
import { RowCheckbox } from "~/components/admin/row-checkbox"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import { Link } from "~/components/common/link"
import { Note } from "~/components/common/note"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableHeader } from "~/components/data-table/data-table-header"
import { DataTableLink } from "~/components/data-table/data-table-link"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import { tagTableParamsSchema } from "~/server/admin/tags/schema"
import type { DataTableFilterField } from "~/types"

const columns: ColumnDef<Tag & { _count?: { tools: number } }>[] = [
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
    accessorKey: "name",
    enableHiding: false,
    size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <DataTableLink href={`/admin/tags/${row.original.id}`} title={row.original.name} />
    ),
  },
  {
    accessorKey: "_count.tools",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tools" />,
    cell: ({ row }) => (
      <Badge prefix={<HashIcon className="opacity-50 size-3!" />} className="tabular-nums">
        {row.original._count?.tools || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
  },
  {
    id: "actions",
    cell: ({ row }) => <TagActions tag={row.original} className="float-right" />,
  },
]

export function TagTable() {
  const [params] = useQueryStates(tagTableParamsSchema)
  const { data, isLoading } = useQuery(orpc.tags.list.queryOptions({ input: params }))

  // Search filters
  const filterFields: DataTableFilterField<Tag>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Filter by name...",
    },
  ]

  const { table } = useDataTable({
    data: data?.tags ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    shallow: false,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
  })

  if (isLoading) {
    return <DataTableSkeleton title="Tags" />
  }

  return (
    <DataTable table={table}>
      <DataTableHeader
        title="Tags"
        total={data?.tagsTotal ?? 0}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/tags/new">
              <div className="max-sm:sr-only">New tag</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <TagTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
