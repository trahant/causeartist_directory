"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { User } from "~/.generated/prisma/browser"
import { Button } from "~/components/common/button"
import { UserDeleteDialog } from "./user-delete-dialog"

interface UserTableToolbarActionsProps {
  table: Table<User>
}

export function UserTableToolbarActions({ table }: UserTableToolbarActionsProps) {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <UserDeleteDialog users={rows.map(row => row.original)}>
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </UserDeleteDialog>
  )
}
