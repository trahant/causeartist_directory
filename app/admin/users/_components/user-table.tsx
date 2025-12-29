"use client"

import { formatDate } from "@primoui/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { useQueryStates } from "nuqs"
import type { ComponentProps } from "react"
import { use } from "react"
import type { User } from "~/.generated/prisma/browser"
import { UserActions } from "~/app/admin/users/_components/user-actions"
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
import type { findUsers } from "~/server/admin/users/queries"
import { userTableParamsSchema } from "~/server/admin/users/schema"
import type { DataTableFilterField } from "~/types"
import { UserTableToolbarActions } from "./user-table-toolbar-actions"

type UserTableProps = {
  usersPromise: ReturnType<typeof findUsers>
}

const roleBadges: Record<"admin" | "user", ComponentProps<typeof Badge>> = {
  admin: {
    variant: "info",
    className: "capitalize",
  },
  user: {
    variant: "outline",
    className: "capitalize",
  },
}

const columns: ColumnDef<User>[] = [
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
        disabled={row.original.role === "admin"}
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
        href={`/admin/users/${row.original.id}`}
        title={row.original.name || row.original.email}
      />
    ),
  },
  {
    accessorKey: "email",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <Note>{row.getValue("email")}</Note>,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue<"admin" | "user">("role")
      const isBanned = row.original.banned

      if (isBanned) {
        return (
          <Badge variant="outline" className="text-red-500">
            Banned
          </Badge>
        )
      }

      return <Badge {...roleBadges[role]}>{role}</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <Note>{formatDate(row.getValue<Date>("createdAt"))}</Note>,
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} className="float-right" />,
  },
]

export function UserTable({ usersPromise }: UserTableProps) {
  const { users, usersTotal, pageCount } = use(usersPromise)
  const [{ perPage, sort }] = useQueryStates(userTableParamsSchema)

  // Search filters
  const filterFields: DataTableFilterField<User>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Search by name or email...",
    },
  ]

  const { table } = useDataTable({
    data: users,
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
    enableRowSelection: row => row.original.role !== "admin",
  })

  return (
    <DataTable table={table}>
      <DataTableHeader title="Users" total={usersTotal}>
        <DataTableToolbar table={table} filterFields={filterFields}>
          <UserTableToolbarActions table={table} />
          <DateRangePicker align="end" />
          <DataTableViewOptions table={table} />
        </DataTableToolbar>
      </DataTableHeader>
    </DataTable>
  )
}
