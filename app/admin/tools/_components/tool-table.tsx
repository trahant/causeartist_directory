"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  PlusIcon,
} from "lucide-react"
import { useQueryStates } from "nuqs"
import type { ComponentProps } from "react"
import { use } from "react"
import { type Tool, ToolStatus } from "~/.generated/prisma/browser"
import { ToolActions } from "~/app/admin/tools/_components/tool-actions"
import { ToolTableToolbarActions } from "~/app/admin/tools/_components/tool-table-toolbar-actions"
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
import { VerifiedBadge } from "~/components/web/verified-badge"
import { useDataTable } from "~/hooks/use-data-table"
import type { findTools } from "~/server/admin/tools/queries"
import { toolTableParamsSchema } from "~/server/admin/tools/schema"
import type { DataTableFilterField } from "~/types"

type ToolTableProps = {
  toolsPromise: ReturnType<typeof findTools>
}

const statusBadges: Record<ToolStatus, ComponentProps<typeof Badge>> = {
  [ToolStatus.Draft]: {
    variant: "soft",
  },

  [ToolStatus.Pending]: {
    variant: "warning",
  },

  [ToolStatus.Scheduled]: {
    variant: "info",
  },

  [ToolStatus.Published]: {
    variant: "success",
  },
}

const columns: ColumnDef<Tool>[] = [
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
    cell: ({ row }) => {
      const { name, slug, faviconUrl, ownerId } = row.original

      return (
        <DataTableLink href={`/admin/tools/${slug}`} image={faviconUrl} title={name}>
          {ownerId && <VerifiedBadge size="sm" />}
        </DataTableLink>
      )
    },
  },
  {
    accessorKey: "tagline",
    enableSorting: false,
    size: 320,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tagline" />,
    cell: ({ row }) => <Note className="truncate">{row.getValue("tagline")}</Note>,
  },
  {
    accessorKey: "submitterEmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Submitter" />,
    cell: ({ row }) => <Note>{row.getValue("submitterEmail")}</Note>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge {...statusBadges[row.original.status]}>{row.original.status}</Badge>,
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Published At" />,
    cell: ({ row }) =>
      row.original.publishedAt ? (
        <Note>{formatDate(row.getValue<Date>("publishedAt"))}</Note>
      ) : (
        <Note>—</Note>
      ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
  },
  {
    id: "actions",
    cell: ({ row }) => <ToolActions tool={row.original} className="float-right" />,
  },
]

export function ToolTable({ toolsPromise }: ToolTableProps) {
  const { tools, total, pageCount } = use(toolsPromise)
  const [{ perPage, sort }] = useQueryStates(toolTableParamsSchema)

  // Search filters
  const filterFields: DataTableFilterField<Tool>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Filter by name...",
    },
    {
      id: "status",
      label: "Status",
      options: [
        {
          label: "Published",
          value: ToolStatus.Published,
          icon: <CircleCheckIcon className="text-green-500" />,
        },
        {
          label: "Scheduled",
          value: ToolStatus.Scheduled,
          icon: <CircleDotIcon className="text-blue-500" />,
        },
        {
          label: "Pending",
          value: ToolStatus.Pending,
          icon: <CircleDotDashedIcon className="text-yellow-600" />,
        },
        {
          label: "Draft",
          value: ToolStatus.Draft,
          icon: <CircleDashedIcon className="text-gray-500" />,
        },
      ],
    },
  ]

  const { table } = useDataTable({
    data: tools,
    columns,
    pageCount,
    filterFields,
    shallow: false,
    clearOnDefault: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: sort,
      columnVisibility: { submitterEmail: false, createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: originalRow => originalRow.id,
  })

  return (
    <DataTable table={table}>
      <DataTableHeader
        title="Tools"
        total={total}
        callToAction={
          <Button variant="primary" size="md" prefix={<PlusIcon />} asChild>
            <Link href="/admin/tools/new">
              <div className="max-sm:sr-only">New tool</div>
            </Link>
          </Button>
        }
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <ToolTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
