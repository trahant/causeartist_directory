"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { HashIcon, PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type { Category } from "~/.generated/prisma/browser"
import { CategoryActions } from "~/app/admin/categories/_components/category-actions"
import { CategoryTableToolbarActions } from "~/app/admin/categories/_components/category-table-toolbar-actions"
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
import { categoryTableParamsSchema } from "~/server/admin/categories/schema"
import type { DataTableFilterField } from "~/types"

const columns: ColumnDef<Category & { _count?: { tools: number } }>[] = [
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
      <DataTableLink href={`/admin/categories/${row.original.id}`} title={row.original.name} />
    ),
  },
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
    cell: ({ row }) => <Note className="max-w-96 truncate">{row.original.label}</Note>,
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
    cell: ({ row }) => <CategoryActions category={row.original} className="float-right" />,
  },
]

export function CategoryTable() {
  const [params] = useQueryStates(categoryTableParamsSchema)
  const { data, isLoading } = useQuery(orpc.categories.list.queryOptions({ input: params }))

  // Search filters
  const filterFields: DataTableFilterField<Category>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Filter by name...",
    },
  ]

  const { table } = useDataTable({
    data: data?.categories ?? [],
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
    return <DataTableSkeleton title="Categories" />
  }

  return (
    <DataTable table={table}>
      <DataTableHeader
        title="Categories"
        total={data?.categoriesTotal ?? 0}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/categories/new">
              <div className="max-sm:sr-only">New category</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <CategoryTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
