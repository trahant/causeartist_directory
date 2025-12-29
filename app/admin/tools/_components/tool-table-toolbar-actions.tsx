"use client"

import type { Table } from "@tanstack/react-table"
import { TrashIcon } from "lucide-react"
import type { Tool } from "~/.generated/prisma/browser"
import { ToolDeleteDialog } from "~/app/admin/tools/_components/tool-delete-dialog"
import { Button } from "~/components/common/button"

interface ToolTableToolbarActionsProps {
  table: Table<Tool>
}

export function ToolTableToolbarActions({ table }: ToolTableToolbarActionsProps) {
  const { rows } = table.getFilteredSelectedRowModel()

  if (!rows.length) {
    return null
  }

  return (
    <ToolDeleteDialog tools={rows.map(row => row.original)}>
      <Button variant="secondary" size="md" prefix={<TrashIcon />}>
        Delete ({rows.length})
      </Button>
    </ToolDeleteDialog>
  )
}
