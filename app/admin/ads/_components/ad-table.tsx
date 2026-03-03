"use client"

import { formatDate } from "@primoui/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { PlusIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type { ComponentProps } from "react"
import { type Ad, AdType } from "~/.generated/prisma/browser"
import { AdActions } from "~/app/admin/ads/_components/ad-actions"
import { AdTableToolbarActions } from "~/app/admin/ads/_components/ad-table-toolbar-actions"
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
import { adListParams } from "~/server/admin/ads/schema"
import type { DataTableFilterField } from "~/types"

type AdStatus = "Active" | "Scheduled" | "Expired"

const getAdStatus = (ad: Ad): AdStatus => {
  const now = new Date()
  if (now < ad.startsAt) return "Scheduled"
  if (now > ad.endsAt) return "Expired"
  return "Active"
}

const statusBadges: Record<AdStatus, ComponentProps<typeof Badge>> = {
  Active: { variant: "success" },
  Scheduled: { variant: "info" },
  Expired: { variant: "soft" },
}

const columns: ColumnDef<Ad>[] = [
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
      <DataTableLink
        href={`/admin/ads/${row.original.id}`}
        image={row.original.faviconUrl}
        title={row.original.name}
      />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    id: "status",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = getAdStatus(row.original)
      return <Badge {...statusBadges[status]}>{status}</Badge>
    },
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Starts At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("startsAt"))}</Note>,
  },
  {
    accessorKey: "endsAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ends At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("endsAt"))}</Note>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
  },
  {
    id: "actions",
    cell: ({ row }) => <AdActions ad={row.original} className="float-right" />,
  },
]

export function AdTable() {
  const [params, setParams] = useQueryStates(adListParams)

  const { data, isLoading, isFetching } = useQuery(
    orpc.ads.list.queryOptions({
      input: params,
      placeholderData: keepPreviousData,
    }),
  )

  // Search filters
  const filterFields: DataTableFilterField<Ad>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Search by name...",
    },
    {
      id: "type",
      label: "Type",
      options: Object.values(AdType).map(type => ({
        label: type,
        value: type,
      })),
    },
  ]

  const { table } = useDataTable({
    data: data?.ads ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    filterFields,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: params.perPage },
      sorting: params.sort,
      columnVisibility: { createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: originalRow => originalRow.id,
  })

  return (
    <DataTable table={table} isLoading={isLoading} isFetching={isFetching && !isLoading}>
      <DataTableHeader
        title="Ads"
        total={data?.adsTotal}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/ads/new">
              <div className="max-sm:sr-only">New ad</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar
          table={table}
          filterFields={filterFields}
          isFiltered={!isDefaultState(adListParams, params, ["perPage", "page"])}
          onReset={() => {
            table.resetColumnFilters()
            void setParams(null)
          }}
        >
          <AdTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
