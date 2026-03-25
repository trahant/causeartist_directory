"use client"

import { formatDate } from "@primoui/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { CompanyTableToolbarActions } from "~/app/admin/companies/_components/company-table-toolbar-actions"
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
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options"
import { useDataTable } from "~/hooks/use-data-table"
import { orpc } from "~/lib/orpc-query"
import { isDefaultState } from "~/lib/parsers"
import { companyListParams } from "~/server/admin/companies/schema"
import type { CompanyListRow } from "~/server/admin/companies/schema"
import type { DataTableFilterField } from "~/types"

const columns: ColumnDef<CompanyListRow>[] = [
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
    size: 200,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <DataTableLink href={`/admin/companies/${row.original.id}`} title={row.original.name} />
    ),
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    cell: ({ row }) => <Note className="font-mono text-xs">{row.original.slug}</Note>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Publish" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === "published" ? "success" : "soft"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "lifecycleStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lifecycle" />,
    cell: ({ row }) => {
      const v = row.original.lifecycleStatus
      const variant = v === "Active" ? "success" : v === "Acquired" ? "soft" : "warning"
      return <Badge variant={variant}>{v}</Badge>
    },
  },
  {
    accessorKey: "tagline",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tagline" />,
    cell: ({ row }) => <Note className="truncate max-w-[240px]">{row.original.tagline}</Note>,
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
        <Link href={`/companies/${row.original.slug}`} target="_blank" rel="noreferrer">
          <ExternalLinkIcon className="size-4" />
          <span className="sr-only">View on site</span>
        </Link>
      </Button>
    ),
  },
]

export function CompanyTable() {
  const [params, setParams] = useQueryStates(companyListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.admin.companies.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  const filterFields: DataTableFilterField<CompanyListRow>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Search by name...",
    },
  ]

  const { table } = useDataTable({
    data: data?.companies ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
    },
    getRowId: (r, i) => `${r.id}-${i}`,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Companies"
        total={data?.companiesTotal}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/companies/new">New company</Link>
          </Button>
        }
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(companyListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <CompanyTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
